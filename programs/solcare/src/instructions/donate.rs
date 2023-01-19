use anchor_lang::prelude::*;
use anchor_spl::associated_token::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constant::*;
use crate::errors::CustomError;
use crate::state::{Campaign, Donor};

pub fn handler(ctx: Context<Donate>, amount: u64) -> Result<()> {
    if ctx.accounts.donor_token.amount < amount {
        return err!(CustomError::BalanceIsNotEnough);
    }

    if ctx.accounts.campaign.funded_amount + amount > ctx.accounts.campaign.target_amount {
        return err!(CustomError::DonatedAmountGreaterThanTarget);
    }

    token::transfer(ctx.accounts.into_transfer_to_vault(), amount)?;
    ctx.accounts.donor.donated_amount += amount;
    ctx.accounts.donor.updated_at = ctx.accounts.clock.unix_timestamp;

    ctx.accounts.campaign.funded_amount += amount;

    if ctx.accounts.campaign.funded_amount == ctx.accounts.campaign.target_amount {
        ctx.accounts.campaign.status = STATUS_FILLED;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = campaign_vault,
        constraint = campaign.status == STATUS_ACTIVE @ CustomError::CampaignIsNotActive,
        constraint = campaign.created_at + campaign.held_duration > clock.unix_timestamp @ CustomError::CampaignFailedToRaiseFunds,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        seeds = [CAMPAIGN_AUTHORITY_SEED, campaign.key().as_ref()],
        bump,
    )]
    pub campaign_authority: SystemAccount<'info>,

    #[account(address = USDC_MINT_PUBKEY)]
    pub usdc_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = campaign_authority,
    )]
    pub campaign_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [DONOR_SEED, campaign.key().as_ref(), authority.key().as_ref()],
        bump,
        constraint = donor.donor == authority.key(),
    )]
    pub donor: Account<'info, Donor>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = authority,
    )]
    pub donor_token: Account<'info, TokenAccount>,

    pub clock: Sysvar<'info, Clock>,

    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

impl<'info> Donate<'info> {
    fn into_transfer_to_vault(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            authority: self.authority.to_account_info(),
            from: self.donor_token.to_account_info(),
            to: self.campaign_vault.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}
