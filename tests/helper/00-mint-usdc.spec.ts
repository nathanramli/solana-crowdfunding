import * as anchor from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
import program from '../utils/program';
import { USDC_MINT } from '../utils';

describe('Mint USDC', () => {
    const mintTo = new anchor.web3.PublicKey(
        'A5ipty7wL4SKwrviwDBTdgwdTwBLCroxi3duGLA7NhRZ'
    );

    it('Setup', async () => {
        const poolMintAccount = await spl.getMint(
            program.provider.connection,
            USDC_MINT
        );
        const tokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            program.provider.connection,
            anchor.Wallet.local().payer,
            poolMintAccount.address,
            mintTo
        );
        const mintTokenTx = await spl.mintToChecked(
            program.provider.connection,
            anchor.Wallet.local().payer,
            poolMintAccount.address,
            tokenAccount.address,
            program.provider.publicKey,
            Math.pow(10, poolMintAccount.decimals) * 100000,
            poolMintAccount.decimals
        );
        console.log('Mint token transaction: ', mintTokenTx);
    });
});
