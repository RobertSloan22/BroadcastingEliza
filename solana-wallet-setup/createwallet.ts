/**
 * createWallet.ts
 *
 * This script demonstrates how to:
 * 1. Generate a new Solana wallet (Keypair).
 * 2. Retrieve its public and secret keys.
 * 3. (Optional) Airdrop SOL on Devnet for testing.
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  PublicKey
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // 1. Connect to the Solana Devnet (for testing).
  //    Replace 'devnet' with 'mainnet-beta' if you want to connect to Mainnet.
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // 2. Generate a new Solana wallet (Keypair).
  const newKeypair = Keypair.generate();

  // 3. Extract the public and secret keys.
  const publicKeyString = newKeypair.publicKey.toBase58();
  const secretKey = newKeypair.secretKey; // This is a Uint8Array

  console.log("New Wallet created!");
  console.log("Public Key:", publicKeyString);
  console.log("Secret Key (Uint8Array):", secretKey);

  // 4. (Recommended) Save the secret key to a file in a secure location.
  //    In production, do NOT commit this file to version control.
  const filePath = path.join(__dirname, "new-keypair.json");
  fs.writeFileSync(filePath, JSON.stringify(Array.from(secretKey)));
  console.log(`Saved secret key to: ${filePath}`);

  // 5. (Optional) Airdrop 1 SOL on Devnet for testing.
  //    On Mainnet, you need real SOL from an exchange or friend.
  const airdropSignature = await connection.requestAirdrop(
    newKeypair.publicKey,
    1 * LAMPORTS_PER_SOL
  );

  // 6. Confirm the transaction.
  await connection.confirmTransaction(airdropSignature);
  console.log(`1 SOL airdropped to the new wallet on Devnet!`);

  // 7. Fetch and display the wallet balance.
  const balance = await connection.getBalance(newKeypair.publicKey);
  console.log("Wallet Balance (SOL):", balance / LAMPORTS_PER_SOL);
}

main().catch((err) => {
  console.error(err);
});
