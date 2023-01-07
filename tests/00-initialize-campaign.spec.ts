import * as anchor from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
import program from './utils/program';
import {
    CAMPAIGN_AUTHORITY_SEED,
    CAMPAIGN_SEED,
    getDerivedAccount,
    getKeypairAccount,
    USDC_MINT,
} from './utils';
import { fromU32NumberToU8Bytes } from './utils/bytes';
import { assert } from 'chai';

describe('Initialize campaign', () => {
    const owner = getKeypairAccount('campaign-owner', true);
    const campaignIndex = 1;

    it('Create campaign success', async () => {
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

        const dayInSeconds = 60 * 60 * 24;
        const usdcMint = await spl.getMint(
            program.provider.connection,
            USDC_MINT
        );

        const campaignDerivedAccount = await getDerivedAccount([
            CAMPAIGN_SEED,
            owner,
            fromU32NumberToU8Bytes(campaignIndex),
        ]);

        const campaignAuthorityDerivedAccount = await getDerivedAccount([
            CAMPAIGN_AUTHORITY_SEED,
            campaignDerivedAccount.publicKey,
        ]);

        const campaignVault = await spl.getAssociatedTokenAddress(
            usdcMint.address,
            campaignAuthorityDerivedAccount.publicKey,
            true
        );

        const heldDuration = new anchor.BN(dayInSeconds * 7);

        const tx = await program.methods
            .initCampaign(
                campaignIndex,
                heldDuration,
                new anchor.BN(1 * Math.pow(10, usdcMint.decimals))
            )
            .accounts({
                owner: owner.publicKey,
                campaign: campaignDerivedAccount.publicKey,
                campaignAuthority: campaignAuthorityDerivedAccount.publicKey,
                usdcMint: usdcMint.address,
                campaignVault: campaignVault,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([anchor.Wallet.local().payer, owner])
            .rpc();

        const campaign = await program.account.campaign.fetchNullable(
            campaignDerivedAccount.publicKey
        );

        assert.isNotNull(campaign);
        assert(campaign.campaignVault.equals(campaignVault));
        assert(campaign.heldDuration.eq(heldDuration));

        console.log('create campaign tx: ' + tx);
    });

    it('Clean up', async () => {
        const transferTransaction = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.transfer({
                fromPubkey: owner.publicKey,
                toPubkey: anchor.Wallet.local().publicKey,
                lamports:
                    (await program.provider.connection.getBalance(
                        owner.publicKey
                    )) - 5000,
            })
        );
        await anchor.web3.sendAndConfirmTransaction(
            program.provider.connection,
            transferTransaction,
            [owner]
        );
    });
});
