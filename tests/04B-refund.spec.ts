import * as anchor from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
import program from './utils/program';
import {
    CAMPAIGN_AUTHORITY_SEED,
    CAMPAIGN_SEED,
    DerivedAccount,
    DONOR_SEED,
    getDerivedAccount,
    getKeypairAccount,
    PROPOSAL_SEED,
    USDC_MINT,
} from './utils';
import { fromU32NumberToU8Bytes } from './utils/bytes';

describe('Refund campaign', async () => {
    const owner = getKeypairAccount('campaign-owner');
    const firstDonor = getKeypairAccount('first-donor');
    const secondDonor = getKeypairAccount('second-donor');

    let usdcMint: spl.Mint,
        campaignDerivedAccount: DerivedAccount,
        campaignAuthorityDerivedAccount: DerivedAccount,
        campaignVault: anchor.web3.PublicKey,
        donorDerivedAccount: DerivedAccount,
        proposalDerivedAccount: DerivedAccount,
        firstDonorTokenAccount: spl.Account,
        secondDonorTokenAccount: spl.Account;
    const campaignIndex = 1;

    it('Setup', async () => {
        usdcMint = await spl.getMint(program.provider.connection, USDC_MINT);
        campaignDerivedAccount = await getDerivedAccount([
            CAMPAIGN_SEED,
            owner,
            fromU32NumberToU8Bytes(campaignIndex),
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
        proposalDerivedAccount = await getDerivedAccount([
            PROPOSAL_SEED,
            campaignDerivedAccount.publicKey,
        ]);

        firstDonorTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            program.provider.connection,
            anchor.Wallet.local().payer,
            usdcMint.address,
            firstDonor.publicKey
        );
        secondDonorTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            program.provider.connection,
            anchor.Wallet.local().payer,
            usdcMint.address,
            secondDonor.publicKey
        );

        const transferTransaction = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.transfer({
                fromPubkey: anchor.Wallet.local().publicKey,
                toPubkey: firstDonor.publicKey,
                lamports: 0.1 * anchor.web3.LAMPORTS_PER_SOL,
            }),
            anchor.web3.SystemProgram.transfer({
                fromPubkey: anchor.Wallet.local().publicKey,
                toPubkey: secondDonor.publicKey,
                lamports: 0.1 * anchor.web3.LAMPORTS_PER_SOL,
            })
        );
        await anchor.web3.sendAndConfirmTransaction(
            program.provider.connection,
            transferTransaction,
            [anchor.Wallet.local().payer]
        );
    });

    it('First donor do refund', async () => {
        donorDerivedAccount = await getDerivedAccount([
            DONOR_SEED,
            campaignDerivedAccount.publicKey,
            firstDonor.publicKey,
        ]);

        const tx = await program.methods
            .refund(owner.publicKey, campaignIndex)
            .accounts({
                authority: firstDonor.publicKey,
                donor: donorDerivedAccount.publicKey,
                donorToken: firstDonorTokenAccount.address,
                usdcMint: usdcMint.address,
                campaign: campaignDerivedAccount.publicKey,
                campaignAuthority: campaignAuthorityDerivedAccount.publicKey,
                campaignVault: campaignVault,
                proposal: proposalDerivedAccount.publicKey,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([anchor.Wallet.local().payer, firstDonor])
            .rpc();
        console.log('Refund Transaction: ' + tx);
    });

    it('Second donor do refund', async () => {
        donorDerivedAccount = await getDerivedAccount([
            DONOR_SEED,
            campaignDerivedAccount.publicKey,
            secondDonor.publicKey,
        ]);

        const tx = await program.methods
            .refund(owner.publicKey, campaignIndex)
            .accounts({
                authority: secondDonor.publicKey,
                donor: donorDerivedAccount.publicKey,
                donorToken: secondDonorTokenAccount.address,
                usdcMint: usdcMint.address,
                campaign: campaignDerivedAccount.publicKey,
                campaignAuthority: campaignAuthorityDerivedAccount.publicKey,
                campaignVault: campaignVault,
                proposal: proposalDerivedAccount.publicKey,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([anchor.Wallet.local().payer, secondDonor])
            .rpc();
        console.log('Refund Transaction: ' + tx);
    });

    it('Clean up', async () => {
        firstDonorTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            program.provider.connection,
            anchor.Wallet.local().payer,
            usdcMint.address,
            firstDonor.publicKey
        );

        secondDonorTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            program.provider.connection,
            anchor.Wallet.local().payer,
            usdcMint.address,
            secondDonor.publicKey
        );

        const minterTokenAccount = await spl.getAssociatedTokenAddress(
            usdcMint.address,
            anchor.Wallet.local().publicKey
        );

        let transferTransaction = new anchor.web3.Transaction().add(
            spl.createTransferCheckedInstruction(
                firstDonorTokenAccount.address,
                usdcMint.address,
                minterTokenAccount,
                firstDonor.publicKey,
                firstDonorTokenAccount.amount,
                usdcMint.decimals
            ),
            anchor.web3.SystemProgram.transfer({
                fromPubkey: firstDonor.publicKey,
                toPubkey: anchor.Wallet.local().publicKey,
                lamports:
                    (await program.provider.connection.getBalance(
                        firstDonor.publicKey
                    )) - 5000,
            })
        );
        await anchor.web3.sendAndConfirmTransaction(
            program.provider.connection,
            transferTransaction,
            [firstDonor]
        );

        transferTransaction = new anchor.web3.Transaction().add(
            spl.createTransferCheckedInstruction(
                secondDonorTokenAccount.address,
                usdcMint.address,
                minterTokenAccount,
                secondDonor.publicKey,
                secondDonorTokenAccount.amount,
                usdcMint.decimals
            ),
            anchor.web3.SystemProgram.transfer({
                fromPubkey: secondDonor.publicKey,
                toPubkey: anchor.Wallet.local().publicKey,
                lamports:
                    (await program.provider.connection.getBalance(
                        secondDonor.publicKey
                    )) - 5000,
            })
        );
        await anchor.web3.sendAndConfirmTransaction(
            program.provider.connection,
            transferTransaction,
            [secondDonor]
        );
    });
});
