import * as anchor from '@project-serum/anchor';
import program from './utils/program';
import {
    CAMPAIGN_SEED,
    DerivedAccount,
    DONOR_SEED,
    getDerivedAccount,
    getKeypairAccount,
    PROPOSAL_SEED,
    VOTE_SEED,
} from './utils';
import { fromU32NumberToU8Bytes } from './utils/bytes';

describe('Vote proposal', async () => {
    const owner = getKeypairAccount('campaign-owner');
    const firstDonor = getKeypairAccount('first-donor');
    const secondDonor = getKeypairAccount('second-donor');

    let campaignDerivedAccount: DerivedAccount,
        proposalDerivedAccount: DerivedAccount;

    const campaignIndex = 1;

    it('Setup', async () => {
        campaignDerivedAccount = await getDerivedAccount([
            CAMPAIGN_SEED,
            owner,
            fromU32NumberToU8Bytes(campaignIndex),
        ]);
        proposalDerivedAccount = await getDerivedAccount([
            PROPOSAL_SEED,
            campaignDerivedAccount.publicKey,
        ]);
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

    it('First Donor Vote proposal', async () => {
        const donorDerivedAccount = await getDerivedAccount([
            DONOR_SEED,
            campaignDerivedAccount.publicKey,
            firstDonor.publicKey,
        ]);

        const voteDerivedAccount = await getDerivedAccount([
            VOTE_SEED,
            proposalDerivedAccount.publicKey,
            firstDonor.publicKey,
        ]);

        const tx = await program.methods
            .voting(owner.publicKey, campaignIndex, true)
            .accounts({
                authority: firstDonor.publicKey,
                donor: donorDerivedAccount.publicKey,
                vote: voteDerivedAccount.publicKey,
                campaign: campaignDerivedAccount.publicKey,
                proposal: proposalDerivedAccount.publicKey,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([anchor.Wallet.local().payer, firstDonor])
            .rpc();
        console.log('Vote proposal Transaction: ' + tx);
    });

    it('Second Donor Vote proposal', async () => {
        const donorDerivedAccount = await getDerivedAccount([
            DONOR_SEED,
            campaignDerivedAccount.publicKey,
            secondDonor.publicKey,
        ]);

        const voteDerivedAccount = await getDerivedAccount([
            VOTE_SEED,
            proposalDerivedAccount.publicKey,
            secondDonor.publicKey,
        ]);

        const tx = await program.methods
            .voting(owner.publicKey, campaignIndex, true)
            .accounts({
                authority: secondDonor.publicKey,
                donor: donorDerivedAccount.publicKey,
                vote: voteDerivedAccount.publicKey,
                campaign: campaignDerivedAccount.publicKey,
                proposal: proposalDerivedAccount.publicKey,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([anchor.Wallet.local().payer, secondDonor])
            .rpc();
        console.log('Vote proposal Transaction: ' + tx);
    });

    it('Clean up', async () => {
        let transferTransaction = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.transfer({
                fromPubkey: firstDonor.publicKey,
                toPubkey: anchor.Wallet.local().publicKey,
                lamports: Math.max(
                    0,
                    (await program.provider.connection.getBalance(
                        firstDonor.publicKey
                    )) - 5000
                ),
            })
        );
        await anchor.web3.sendAndConfirmTransaction(
            program.provider.connection,
            transferTransaction,
            [firstDonor]
        );

        transferTransaction = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.transfer({
                fromPubkey: secondDonor.publicKey,
                toPubkey: anchor.Wallet.local().publicKey,
                lamports: Math.max(
                    0,
                    (await program.provider.connection.getBalance(
                        secondDonor.publicKey
                    )) - 5000
                ),
            })
        );
        await anchor.web3.sendAndConfirmTransaction(
            program.provider.connection,
            transferTransaction,
            [secondDonor]
        );
    });
});
