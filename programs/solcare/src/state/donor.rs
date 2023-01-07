use anchor_lang::prelude::*;

#[account]
pub struct Donor {
    pub donor: Pubkey,
    pub campaign: Pubkey,
    pub donated_amount: u64,
    pub updated_at: i64,
    pub refunded: bool,
}

impl Donor {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1;
}
