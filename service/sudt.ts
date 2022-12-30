import {Cell} from "@ckb-lumos/base/lib/api";
import {BI, helpers} from "@ckb-lumos/lumos";
import {AGGRON4} from "./transfer";
import {utils} from "@ckb-lumos/base";
import {BIish} from "@ckb-lumos/bi";



export function issueTokenCell(from: string,amount :BIish):Cell {
    const toScript = helpers.parseAddress(from, {config: AGGRON4});
    return {
        cellOutput: {
            capacity: BI.from(150).mul(100000000).toHexString(),
            lock: toScript,
            type:{
                codeHash: AGGRON4.SCRIPTS.SUDT.CODE_HASH,
                hashType: AGGRON4.SCRIPTS.SUDT.HASH_TYPE,
                args: utils.computeScriptHash(toScript)
            }
        },
        data: utils.toBigUInt128LE(amount),
    };
}




