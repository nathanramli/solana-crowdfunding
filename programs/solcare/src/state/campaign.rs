use anchor_lang::prelude::*;

#[account]
pub struct Campaign {
    pub owner: Pubkey,
    pub created_at: i64,
    pub held_duration: i64,
    pub target_amount: u64,
    pub funded_amount: u64,
    pub campaign_vault: Pubkey,
    pub status: u8,
}

impl Campaign {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 8 + 32 + 1;
}
