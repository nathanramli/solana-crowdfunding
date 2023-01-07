import * as anchor from '@project-serum/anchor';
import program from './utils/program';
import {
    CAMPAIGN_SEED,
    DerivedAccount,
    getDerivedAccount,
    getKeypairAccount,
    PROPOSAL_SEED,
} from './utils';
import { fromU32NumberToU8Bytes } from './utils/bytes';

describe('Initialize proposal', async () => {
    const owner = getKeypairAccount('campaign-owner');

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

    it('Init proposal', async () => {
        const tx = await program.methods
            .initProposal(campaignIndex)
            .accounts({
                owner: owner.publicKey,
                campaign: campaignDerivedAccount.publicKey,
                proposal: proposalDerivedAccount.publicKey,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([anchor.Wallet.local().payer, owner])
            .rpc();
        console.log('Init proposal Transaction: ' + tx);
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
