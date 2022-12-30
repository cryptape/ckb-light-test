import {BIish} from "@ckb-lumos/bi";
import { commons, hd, helpers, Indexer, RPC} from "@ckb-lumos/lumos";
import {ACCOUNT_PRIVATE, CKB_RPC_INDEX_URL, CKB_RPC_URL, FeeRate} from "../config/config";
import {AGGRON4, generateAccountFromPrivateKey} from "./transfer";
import {sudt} from "@ckb-lumos/common-scripts";
import {utils} from "@ckb-lumos/base";

const ckbRpcUrl = CKB_RPC_URL;
const ckbRpcIndexUrl = CKB_RPC_INDEX_URL;
const rpc = new RPC(ckbRpcUrl);
const indexer = new Indexer(ckbRpcIndexUrl, ckbRpcUrl);

export function getTokenScriptType(privateKey:string){
    let acc = generateAccountFromPrivateKey(privateKey)

    let script = helpers.parseAddress(acc.address)
    return {
        code_hash: AGGRON4.SCRIPTS.SUDT.CODE_HASH,
        hash_type: AGGRON4.SCRIPTS.SUDT.HASH_TYPE,
        args: utils.computeScriptHash(script)
    }
}



export async function issueToken(privateKey: string, amount: BIish): Promise<string> {

    let acc = generateAccountFromPrivateKey(privateKey)

    let txSkeleton = helpers.TransactionSkeleton({cellProvider: indexer})

    txSkeleton = await sudt.issueToken(
        txSkeleton,
        acc.address,
        utils.toBigUInt128LE(amount), undefined, undefined,
        {
            config: AGGRON4
        }
    );
    txSkeleton = await commons.common.payFee(txSkeleton,[acc.address],FeeRate.NORMAL)
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)?.message;
    const Sig = hd.key.signRecoverable(message!, ACCOUNT_PRIVATE);
    let tx1 = helpers.sealTransaction(txSkeleton, [Sig]);
    return await rpc.sendTransaction(tx1, "passthrough");
}
