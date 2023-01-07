use crate::constant::*;
use crate::errors::CustomError;
use crate::state::{Campaign, Proposal};
use anchor_lang::prelude::*;

pub fn handler(ctx: Context<InitProposal>, _index: u32) -> Result<()> {
    ctx.accounts.campaign.status = STATUS_VOTING;

    ctx.accounts.proposal.campaign = ctx.accounts.campaign.key();
    ctx.accounts.proposal.agree = 0;
    ctx.accounts.proposal.disagree = 0;
    ctx.accounts.proposal.duration = VOTING_DURATION_IN_DAYS as i64 * 60 * 60 * 24;
    ctx.accounts.proposal.created_at = ctx.accounts.clock.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
#[instruction(index: u32)]
pub struct InitProposal<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [CAMPAIGN_SEED, owner.key().as_ref(), index.to_le_bytes().as_ref()],
        bump,
        constraint = campaign.status == STATUS_FILLED @ CustomError::CampaignIsNotFilled,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        init,
        payer = owner,
        space = Proposal::LEN,
        seeds = [PROPOSAL_SEED, campaign.key().as_ref()],
        bump,
    )]
    pub proposal: Account<'info, Proposal>,

    pub clock: Sysvar<'info, Clock>,

    pub system_program: Program<'info, System>,
}
