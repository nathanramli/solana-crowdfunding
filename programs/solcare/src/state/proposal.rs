use anchor_lang::prelude::*;

#[account]
pub struct Proposal {
    pub campaign: Pubkey,
    pub created_at: i64,
    pub duration: i64,
    pub agree: u64,
    pub disagree: u64,
    pub updated_at: i64,
}

impl Proposal {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 8 + 8;
}
