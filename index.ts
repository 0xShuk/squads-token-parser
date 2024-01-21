import {Connection, PublicKey} from "@solana/web3.js";
import BN from "bn.js";
import * as token from "@solana/spl-token";
import {VaultTransaction} from "./multisig/src/generated/accounts/VaultTransaction";

const connection = new Connection("RPC_HERE", "confirmed");

type TokenTransferChecked = {
    sender: PublicKey,
    senderTokenAccount: PublicKey,
    mint: PublicKey,
    recepient: PublicKey,
    recepientTokenAccount: PublicKey,
    amount: BN
}

(async() => {
    const txKey = new PublicKey("7Wq5E2My3EydqrkxmU22MngaByt7AfPvsxGwWCRbXtsw")
    const txData = await VaultTransaction.fromAccountAddress(connection, txKey)

    const deserializeData = await deserializeTokenTrf(txData)
    console.log(deserializeData)
})()


async function deserializeTokenTrf(txData: VaultTransaction) : Promise<TokenTransferChecked> {
    const keys = txData.message.accountKeys;
    const instruction = txData.message.instructions[0];
    const indexes = instruction.accountIndexes;

    const mint = keys[indexes[1]];
    const senderTokenAccount = keys[indexes[0]];
    const recepientTokenAccount = keys[indexes[2]];

    const arrLen = instruction.data.length;
    const amountArr = instruction.data.subarray(1, arrLen-1).reverse();
    const amountWhole = new BN(Array.from(amountArr).map(n => n.toString(16)).join(""), "hex");
    const amount = amountWhole.div(new BN(Math.pow(10, instruction.data[arrLen-1])));

    const senderDetails = await token.getAccount(connection, senderTokenAccount);
    const recepientDetails = await token.getAccount(connection, recepientTokenAccount);

    return {
        sender: senderDetails.owner,
        senderTokenAccount,
        mint,
        recepient: recepientDetails.owner,
        recepientTokenAccount,
        amount
    }
}

