use anchor_lang::prelude::*;

#[account]
pub struct Vote {
    pub proposal: Pubkey,
    pub created_at: i64,
    pub voter: Pubkey,
    pub is_agree: bool,
    pub quantity: u64,
}

impl Vote {
    pub const LEN: usize = 8 + 32 + 8 + 32 + 1 + 8;
}
