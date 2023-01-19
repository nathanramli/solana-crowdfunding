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
    USDC_MINT,
} from './utils';
import { fromU32NumberToU8Bytes } from './utils/bytes';

describe('Donate to campaign', async () => {
    const owner = getKeypairAccount('campaign-owner');
    const firstDonor = getKeypairAccount('first-donor', true);
    const secondDonor = getKeypairAccount('second-donor', true);

    let usdcMint: spl.Mint,
        campaignDerivedAccount: DerivedAccount,
        campaignAuthorityDerivedAccount: DerivedAccount,
        campaignVault: anchor.web3.PublicKey,
        donorDerivedAccount: DerivedAccount,
        firstDonorTokenAccount: spl.Account,
        secondDonorTokenAccount: spl.Account,
        donatedAmount: anchor.BN;

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

        donatedAmount = new anchor.BN(0.5 * Math.pow(10, usdcMint.decimals));

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

        const fundFirstDonorTx = await spl.transferChecked(
            program.provider.connection,
            anchor.Wallet.local().payer,
            await spl.getAssociatedTokenAddress(
                usdcMint.address,
                anchor.Wallet.local().publicKey
            ),
            usdcMint.address,
            firstDonorTokenAccount.address,
            anchor.Wallet.local().payer,
            donatedAmount.toNumber(),
            usdcMint.decimals
        );
        console.log('Fund first donor tx: ', fundFirstDonorTx);

        const fundSecondDonorTx = await spl.transferChecked(
            program.provider.connection,
            anchor.Wallet.local().payer,
            await spl.getAssociatedTokenAddress(
                usdcMint.address,
                anchor.Wallet.local().publicKey
            ),
            usdcMint.address,
            secondDonorTokenAccount.address,
            anchor.Wallet.local().payer,
            donatedAmount.toNumber(),
            usdcMint.decimals
        );
        console.log('Fund second donor tx: ', fundSecondDonorTx);

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

    it('First donor donated to campaign', async () => {
        const preIxs = new Array<anchor.web3.TransactionInstruction>();

        donorDerivedAccount = await getDerivedAccount([
            DONOR_SEED,
            campaignDerivedAccount.publicKey,
            firstDonor.publicKey,
        ]);

        if (
            (await program.provider.connection.getAccountInfo(
                donorDerivedAccount.publicKey
            )) === null
        ) {
            const initDonor = await program.methods
                .initDonor()
                .accounts({
                    authority: firstDonor.publicKey,
                    campaign: campaignDerivedAccount.publicKey,
                    donor: donorDerivedAccount.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([anchor.Wallet.local().payer])
                .instruction();
            preIxs.push(initDonor);
        }

        const tx = await program.methods
            .donate(new anchor.BN(0.5 * Math.pow(10, usdcMint.decimals)))
            .preInstructions(preIxs)
            .accounts({
                authority: firstDonor.publicKey,
                campaign: campaignDerivedAccount.publicKey,
                campaignAuthority: campaignAuthorityDerivedAccount.publicKey,
                campaignVault: campaignVault,
                usdcMint: usdcMint.address,
                donor: donorDerivedAccount.publicKey,
                donorToken: firstDonorTokenAccount.address,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
                associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([anchor.Wallet.local().payer, firstDonor])
            .rpc();
        console.log('Donate Campaign Transaction: ' + tx);
    });

    it('Second donor donated to campaign', async () => {
        const preIxs = new Array<anchor.web3.TransactionInstruction>();

        donorDerivedAccount = await getDerivedAccount([
            DONOR_SEED,
            campaignDerivedAccount.publicKey,
            secondDonor.publicKey,
        ]);

        if (
            (await program.provider.connection.getAccountInfo(
                donorDerivedAccount.publicKey
            )) === null
        ) {
            const initDonor = await program.methods
                .initDonor()
                .accounts({
                    authority: secondDonor.publicKey,
                    campaign: campaignDerivedAccount.publicKey,
                    donor: donorDerivedAccount.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([anchor.Wallet.local().payer, secondDonor])
                .instruction();
            preIxs.push(initDonor);
        }

        const tx = await program.methods
            .donate(new anchor.BN(0.5 * Math.pow(10, usdcMint.decimals)))
            .preInstructions(preIxs)
            .accounts({
                authority: secondDonor.publicKey,
                campaign: campaignDerivedAccount.publicKey,
                campaignAuthority: campaignAuthorityDerivedAccount.publicKey,
                campaignVault: campaignVault,
                usdcMint: usdcMint.address,
                donor: donorDerivedAccount.publicKey,
                donorToken: secondDonorTokenAccount.address,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
                associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([anchor.Wallet.local().payer, secondDonor])
            .rpc();
        console.log('Donate Campaign Transaction: ' + tx);
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
