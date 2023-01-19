import * as anchor from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
import program from './utils/program';
import {
    CAMPAIGN_AUTHORITY_SEED,
    CAMPAIGN_SEED,
    DerivedAccount,
    getDerivedAccount,
    getKeypairAccount,
    PROPOSAL_SEED,
    USDC_MINT,
} from './utils';
import { fromU32NumberToU8Bytes } from './utils/bytes';
import { assert } from 'chai';

describe('Claim funds', async () => {
    const owner = getKeypairAccount('campaign-owner');

    let usdcMint: spl.Mint,
        campaignOwnerTokenAccount: spl.Account,
        campaignDerivedAccount: DerivedAccount,
        proposalDerivedAccount: DerivedAccount,
        campaignAuthorityDerivedAccount: DerivedAccount,
        campaignVault: anchor.web3.PublicKey;

    const campaignIndex = 1;

    it('Setup', async () => {
        usdcMint = await spl.getMint(program.provider.connection, USDC_MINT);
        campaignDerivedAccount = await getDerivedAccount([
            CAMPAIGN_SEED,
            owner,
            fromU32NumberToU8Bytes(campaignIndex),
        ]);
        proposalDerivedAccount = await getDerivedAccount([
            PROPOSAL_SEED,
            campaignDerivedAccount.publicKey,
        ]);
        campaignAuthorityDerivedAccount = await getDerivedAccount([
            CAMPAIGN_AUTHORITY_SEED,
            campaignDerivedAccount.publicKey,
        ]);
        campaignVault = await spl.getAssociatedTokenAddress(
            usdcMint.address,
            campaignAuthorityDerivedAccount.publicKey,
            true
        );
        const transferTransaction = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.transfer({
                fromPubkey: anchor.Wallet.local().publicKey,
                toPubkey: owner.publicKey,
                lamports: 0.1 * anchor.web3.LAMPORTS_PER_SOL,
            })
        );
        await anchor.web3.sendAndConfirmTransaction(
            program.provider.connection,
            transferTransaction,
            [anchor.Wallet.local().payer]
        );
    });

    it('Campaign owner claim funds', async () => {
        campaignOwnerTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            program.provider.connection,
            anchor.Wallet.local().payer,
            usdcMint.address,
            owner.publicKey
        );

        const tx = await program.methods
            .claimFunds()
            .accounts({
                owner: owner.publicKey,
                campaign: campaignDerivedAccount.publicKey,
                campaignAuthority: campaignAuthorityDerivedAccount.publicKey,
                usdcMint: usdcMint.address,
                campaignVault: campaignVault,
                proposal: proposalDerivedAccount.publicKey,
                ownerToken: campaignOwnerTokenAccount.address,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
                associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([anchor.Wallet.local().payer, owner])
            .rpc();
        console.log('Claim funds Transaction: ' + tx);

        const newOwnerTokenAccount =
            await spl.getOrCreateAssociatedTokenAccount(
                program.provider.connection,
                anchor.Wallet.local().payer,
                usdcMint.address,
                owner.publicKey
            );

        const campaign = await program.account.campaign.fetch(
            campaignDerivedAccount.publicKey
        );

        assert(
            new anchor.BN(campaignOwnerTokenAccount.amount.toString())
                .add(campaign.targetAmount)
                .eq(new anchor.BN(newOwnerTokenAccount.amount.toString()))
        );
    });

    it('Clean up', async () => {
        const newCampaignOwnerTokenAccount =
            await spl.getOrCreateAssociatedTokenAccount(
                program.provider.connection,
                anchor.Wallet.local().payer,
                usdcMint.address,
                owner.publicKey
            );

        const minterTokenAccount = await spl.getAssociatedTokenAddress(
            usdcMint.address,
            anchor.Wallet.local().publicKey
        );

        const transferTransaction = new anchor.web3.Transaction().add(
            spl.createTransferCheckedInstruction(
                newCampaignOwnerTokenAccount.address,
                usdcMint.address,
                minterTokenAccount,
                owner.publicKey,
                newCampaignOwnerTokenAccount.amount,
                usdcMint.decimals
            ),
            anchor.web3.SystemProgram.transfer({
                fromPubkey: owner.publicKey,
                toPubkey: anchor.Wallet.local().publicKey,
                lamports: Math.max(
                    0,
                    (await program.provider.connection.getBalance(
                        owner.publicKey
                    )) - 5000
                ),
            })
        );
        await anchor.web3.sendAndConfirmTransaction(
            program.provider.connection,
            transferTransaction,
            [owner]
        );
    });
});
