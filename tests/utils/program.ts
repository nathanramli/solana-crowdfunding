import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Solcare } from '../../target/types/solcare';

const connection = new anchor.web3.Connection(
    'https://solana-devnet.g.alchemy.com/v2/bIPuobg6X0eDu34Afyg_24zQsQAjPoLE'
);

const provider = new anchor.AnchorProvider(connection, anchor.Wallet.local(), {
    commitment: 'finalized',
    preflightCommitment: 'confirmed',
});
anchor.setProvider(provider);

const program = anchor.workspace.Solcare as Program<Solcare>;

export default program;
