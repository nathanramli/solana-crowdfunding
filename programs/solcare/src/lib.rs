use anchor_lang::prelude::*;

pub mod constant;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("DqBjFvgYa8drGBcKdSSQ51jLEWWnr6z14MzXKxGu5JvX");

#[program]
pub mod solcare {
    use super::*;

    pub fn init_campaign(
        ctx: Context<InitCampaign>,
        increment: u32,
        held_duration: i64,
        target_amount: u64,
    ) -> Result<()> {
        init_campaign::handler(ctx, increment, held_duration, target_amount)
    }

    pub fn init_donor(ctx: Context<InitDonor>, campaign_owner: Pubkey, index: u32) -> Result<()> {
        init_donor::handler(ctx, campaign_owner, index)
    }

    pub fn init_proposal(ctx: Context<InitProposal>, index: u32) -> Result<()> {
        init_proposal::handler(ctx, index)
    }

    pub fn donate(
        ctx: Context<Donate>,
        campaign_owner: Pubkey,
        index: u32,
        amount: u64,
    ) -> Result<()> {
        donate::handler(ctx, campaign_owner, index, amount)
    }

    pub fn voting(
        ctx: Context<Voting>,
        campaign_owner: Pubkey,
        index: u32,
        agree: bool,
    ) -> Result<()> {
        voting::handler(ctx, campaign_owner, index, agree)
    }

    pub fn claim_funds(ctx: Context<ClaimFunds>, index: u32) -> Result<()> {
        claim_funds::handler(ctx, index)
    }

    pub fn refund(ctx: Context<Refund>, campaign_owner: Pubkey, index: u32) -> Result<()> {
        refund::handler(ctx, campaign_owner, index)
    }
}
