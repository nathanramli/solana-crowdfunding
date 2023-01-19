use crate::constant::*;
use crate::errors::CustomError;
use crate::state::{Campaign, Donor};
use anchor_lang::prelude::*;

pub fn handler(ctx: Context<InitDonor>) -> Result<()> {
    ctx.accounts.donor.campaign = ctx.accounts.campaign.key();
    ctx.accounts.donor.donor = ctx.accounts.authority.key();
    ctx.accounts.donor.refunded = false;
    ctx.accounts.donor.donated_amount = 0;
    ctx.accounts.donor.updated_at = 0;

    Ok(())
}

#[derive(Accounts)]
pub struct InitDonor<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        constraint = campaign.status == STATUS_ACTIVE @ CustomError::CampaignIsNotActive,
        constraint = campaign.created_at + campaign.held_duration > clock.unix_timestamp @ CustomError::CampaignFailedToRaiseFunds,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        init,
        payer = authority,
        space = Donor::LEN,
        seeds = [DONOR_SEED, campaign.key().as_ref(), authority.key().as_ref()],
        bump,
    )]
    pub donor: Account<'info, Donor>,

    pub clock: Sysvar<'info, Clock>,

    pub system_program: Program<'info, System>,
}
