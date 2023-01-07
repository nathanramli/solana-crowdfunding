use anchor_lang::{constant, prelude::Pubkey};

#[constant]
pub const CAMPAIGN_SEED: &[u8] = b"campaign_seed";

#[constant]
pub const CAMPAIGN_AUTHORITY_SEED: &[u8] = b"campaign_authority_seed";

#[constant]
pub const DONOR_SEED: &[u8] = b"donor_seed";

#[constant]
pub const PROPOSAL_SEED: &[u8] = b"proposal_seed";

#[constant]
pub const VOTE_SEED: &[u8] = b"vote_seed";

#[constant]
pub const STATUS_ACTIVE: u8 = 0;

#[constant]
pub const STATUS_FILLED: u8 = 1;

#[constant]
pub const STATUS_NOT_FILLED: u8 = 2;

#[constant]
pub const STATUS_VOTING: u8 = 3;

#[constant]
pub const STATUS_FUNDED: u8 = 4;

#[constant]
pub const STATUS_NOT_FUNDED: u8 = 5;

#[constant]
pub const VOTING_DURATION_IN_DAYS: u8 = 3;

#[constant]
pub const USDC_MINT_PUBKEY: Pubkey = Pubkey::new_from_array([
    104, 146, 249, 200, 170, 10, 89, 118, 166, 205, 86, 177, 177, 71, 178, 18, 149, 129, 244, 116,
    13, 216, 69, 146, 239, 73, 202, 144, 19, 110, 8, 4,
]); // 83DPRebGNu41Gr1ucibUtp538GuUJab8b1Quy5BkqDkf

#[constant]
pub const USDC_DECIMALS: u8 = 9;
