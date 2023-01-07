use crate::constant::*;
use crate::errors::CustomError;
use crate::state::{Campaign, Donor, Proposal, Vote};
use anchor_lang::prelude::*;

pub fn handler(
    ctx: Context<Voting>,
    _campaign_owner: Pubkey,
    _index: u32,
    agree: bool,
) -> Result<()> {
    if agree {
        ctx.accounts.proposal.agree += ctx.accounts.donor.donated_amount;
    } else {
        ctx.accounts.proposal.disagree += ctx.accounts.donor.donated_amount;
    }

    ctx.accounts.vote.created_at = ctx.accounts.clock.unix_timestamp;
    ctx.accounts.vote.is_agree = agree;
    ctx.accounts.vote.proposal = ctx.accounts.proposal.key();
    ctx.accounts.vote.quantity = ctx.accounts.donor.donated_amount;
    ctx.accounts.vote.voter = ctx.accounts.authority.key();

    Ok(())
}

#[derive(Accounts)]
#[instruction(campaign_owner: Pubkey, index: u32)]
pub struct Voting<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [DONOR_SEED, campaign.key().as_ref(), authority.key().as_ref()],
        bump,
        constraint = donor.donor == authority.key(),
    )]
    pub donor: Account<'info, Donor>,

    #[account(
        init,
        payer = authority,
        space = Vote::LEN,
        seeds = [VOTE_SEED, proposal.key().as_ref(), authority.key().as_ref()],
        bump,
    )]
    pub vote: Account<'info, Vote>,

    #[account(
        seeds = [CAMPAIGN_SEED, campaign_owner.key().as_ref(), index.to_le_bytes().as_ref()],
        bump,
        constraint = campaign.status == STATUS_VOTING @ CustomError::CampaignIsNotInVotingPeriod,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        mut,
        seeds = [PROPOSAL_SEED, campaign.key().as_ref()],
        bump,
    )]
    pub proposal: Account<'info, Proposal>,

    pub clock: Sysvar<'info, Clock>,

    pub system_program: Program<'info, System>,
}
