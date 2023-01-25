use crate::constant::*;
use crate::errors::CustomError;
use crate::state::{Campaign, Donor, Proposal};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

pub fn handler(ctx: Context<Refund>) -> Result<()> {
    if !ctx.accounts.is_campaign_failed_to_raise() && !ctx.accounts.is_proposal_declined() {
        return err!(CustomError::NotInRefundableState);
    }

    let campaign_authority_seed = &[
        CAMPAIGN_AUTHORITY_SEED,
        ctx.accounts.campaign.to_account_info().key.as_ref(),
        &[*ctx.bumps.get("campaign_authority").unwrap()],
    ];

    token::transfer(
        ctx.accounts
            .into_transfer_to_donor()
            .with_signer(&[&campaign_authority_seed[..]]),
        ctx.accounts.donor.donated_amount,
    )?;

    ctx.accounts.donor.refunded = true;

    Ok(())
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [DONOR_SEED, campaign.key().as_ref(), authority.key().as_ref()],
        bump,
        constraint = donor.donor == authority.key(),
        constraint = !donor.refunded @ CustomError::DonationHasBeenRefunded,
    )]
    pub donor: Account<'info, Donor>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = authority,
    )]
    pub donor_token: Account<'info, TokenAccount>,

    #[account(address = USDC_MINT_PUBKEY)]
    pub usdc_mint: Account<'info, Mint>,

    pub campaign: Account<'info, Campaign>,

    #[account(
        seeds = [CAMPAIGN_AUTHORITY_SEED, campaign.key().as_ref()],
        bump,
    )]
    pub campaign_authority: SystemAccount<'info>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = campaign_authority,
    )]
    pub campaign_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA validation is enough
    #[account(
        seeds = [PROPOSAL_SEED, campaign.key().as_ref()],
        bump,
        // constraint = ((proposal.agree + proposal.disagree >= campaign.funded_amount) || (clock.unix_timestamp > proposal.created_at + proposal.duration)) @ CustomError::VotingHasNotEnd,
    )]
    pub proposal: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
}

impl<'info> Refund<'info> {
    fn into_transfer_to_donor(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            authority: self.campaign_authority.to_account_info(),
            from: self.campaign_vault.to_account_info(),
            to: self.donor_token.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn is_proposal_declined(&self) -> bool {
        if self.campaign.status == STATUS_VOTING {
            if let Ok(proposal) = Account::<Proposal>::try_from(&self.proposal) {   
                if (proposal.agree + proposal.disagree >= self.campaign.funded_amount) || (self.clock.unix_timestamp > proposal.created_at + proposal.duration)
                {
                    return !(proposal.agree == 0 && proposal.disagree == 0) && proposal.agree < proposal.disagree
                }
            }
        }
        false
    }

    fn is_campaign_failed_to_raise(&self) -> bool {
        if self.campaign.status == STATUS_ACTIVE {
            return self.clock.unix_timestamp > self.campaign.created_at + self.campaign.held_duration
        }
        false
    }
}
