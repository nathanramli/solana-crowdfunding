use anchor_lang::prelude::*;

pub mod constant;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("7Ji9oG6aVk8SJutzwRP3nFZJYXtq7FaDqkVWvmBbc4z");

#[program]
pub mod solcare {
    use super::*;

    pub fn init_campaign(
        ctx: Context<InitCampaign>,
        increment: u32,
        target_amount: u64,
    ) -> Result<()> {
        init_campaign::handler(ctx, increment, target_amount)
    }

    pub fn init_donor(ctx: Context<InitDonor>) -> Result<()> {
        init_donor::handler(ctx)
    }

    pub fn init_proposal(ctx: Context<InitProposal>) -> Result<()> {
        init_proposal::handler(ctx)
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        donate::handler(ctx, amount)
    }

    pub fn voting(ctx: Context<Voting>, agree: bool) -> Result<()> {
        voting::handler(ctx, agree)
    }

    pub fn claim_funds(ctx: Context<ClaimFunds>) -> Result<()> {
        claim_funds::handler(ctx)
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        refund::handler(ctx)
    }
}
