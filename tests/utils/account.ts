import * as anchor from '@project-serum/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import { resolve, join } from 'path';
import program from './program';

export const getKeypairAccount = (
    name: string,
    write: boolean = false
): Keypair => {
    const keysPath = resolve(__dirname, '../keys');

    if (!fs.existsSync(keysPath)) fs.mkdirSync(keysPath);

    if (fs.existsSync(join(keysPath, `${name}.json`))) {
        const keypairData = JSON.parse(
            fs.readFileSync(join(keysPath, `${name}.json`), 'utf-8')
        );
        const secretKey = Uint8Array.from(keypairData);

        return Keypair.fromSecretKey(secretKey);
    } else {
        const keypair = Keypair.generate();

        if (write)
            fs.writeFileSync(
                join(keysPath, `${name}.json`),
                JSON.stringify(Array.from(keypair.secretKey))
            );

        return keypair;
    }
};

interface ToBytes {
    toBytes(): Uint8Array;
}

interface havePublicKey {
    publicKey: PublicKey;
}

type DerivedAccountSeed = havePublicKey | ToBytes | Uint8Array | string;

export class DerivedAccount {
    public publicKey: PublicKey;
    public bump: number;

    constructor(publicKey: PublicKey, bump: number) {
        this.publicKey = publicKey;
        this.bump = bump;
    }
}

/**
 * Find a PDA
 *
 * @param seeds
 * @returns
 */
export const getDerivedAccount = async (
    seeds: DerivedAccountSeed[],
    programId = program.programId
): Promise<DerivedAccount> => {
    const seedBytes = seeds.map((seed) => {
        if (typeof seed == 'string') {
            return anchor.utils.bytes.utf8.encode(seed);
        } else if ('publicKey' in seed) {
            return seed.publicKey.toBytes();
        } else if ('toBytes' in seed) {
            return seed.toBytes();
        } else {
            return seed;
        }
    });
    const [publicKey, bumpSeed] = await PublicKey.findProgramAddress(
        seedBytes,
        programId
    );

    return new DerivedAccount(publicKey, bumpSeed);
};
