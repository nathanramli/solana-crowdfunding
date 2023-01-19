use anchor_lang::prelude::*;
use anchor_spl::associated_token::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constant::*;
use crate::errors::CustomError;
use crate::state::Campaign;

pub fn handler(ctx: Context<InitCampaign>, _increment: u32, target_amount: u64) -> Result<()> {
    require!(
        target_amount % 10u64.pow(USDC_DECIMALS as u32) == 0,
        CustomError::InvalidTargetAmount
    );

    ctx.accounts.campaign.created_at = ctx.accounts.clock.unix_timestamp;
    ctx.accounts.campaign.owner = ctx.accounts.owner.key();
    ctx.accounts.campaign.campaign_vault = ctx.accounts.campaign_vault.key();
    ctx.accounts.campaign.funded_amount = 0;
    let a_day_in_seconds = 24 * 60 * 60;
    ctx.accounts.campaign.held_duration = 90 * a_day_in_seconds;
    ctx.accounts.campaign.target_amount = target_amount;
    ctx.accounts.campaign.status = STATUS_ACTIVE;

    Ok(())
}

#[derive(Accounts)]
#[instruction(increment: u32)]
pub struct InitCampaign<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Campaign::LEN,
        seeds = [CAMPAIGN_SEED, owner.key().as_ref(), increment.to_le_bytes().as_ref()],
        bump,
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
        init,
        payer = owner,
        associated_token::mint = usdc_mint,
        associated_token::authority = campaign_authority,
    )]
    pub campaign_vault: Account<'info, TokenAccount>,

    pub clock: Sysvar<'info, Clock>,

    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}
