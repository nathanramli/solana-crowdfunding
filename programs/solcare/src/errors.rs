use anchor_lang::error_code;

#[error_code]
pub enum CustomError {
    #[msg("Invalid held duration")]
    InvalidHeldDuration,

    #[msg("Invalid target amount")]
    InvalidTargetAmount,

    #[msg("Campaign is not active")]
    CampaignIsNotActive,

    #[msg("Campaign is failed to raise funds")]
    CampaignFailedToRaiseFunds,

    #[msg("Campaign is not filled")]
    CampaignIsNotFilled,

    #[msg("Campaign is not in voting period")]
    CampaignIsNotInVotingPeriod,

    #[msg("Donated amount greater than target")]
    DonatedAmountGreaterThanTarget,

    #[msg("Voting has not end")]
    VotingHasNotEnd,

    #[msg("Can't claim fund")]
    CantClaimFund,

    #[msg("Not in refundable state")]
    NotInRefundableState,

    #[msg("Donation has been refunded")]
    DonationHasBeenRefunded,

    #[msg("Balance is not enough")]
    BalanceIsNotEnough,
}
