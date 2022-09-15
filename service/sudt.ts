// {
//     "code_hash": "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
//     "hash_type": "type",
//     "out_point": {
//     "tx_hash": "0xc1b2ae129fad7465aaa9acc9785f842ba3e6e8b8051d899defa89f5508a77958",
//         "index": "0x0"
// },
//     "dep_type": "code"
// }


import {Cell, HashType} from "@ckb-lumos/base/lib/api";
import {BI, helpers} from "@ckb-lumos/lumos";
import {AGGRON4} from "./transfer";
import {utils} from "@ckb-lumos/base";
import {BIish} from "@ckb-lumos/bi";



export function issueTokenCell(from: string,amount :BIish):Cell {
    const toScript = helpers.parseAddress(from, {config: AGGRON4});
    return {
        cell_output: {
            capacity: BI.from(240).mul(100000000).toHexString(),
            lock: toScript,
            type:{
                code_hash: AGGRON4.SCRIPTS.SUDT.CODE_HASH,
                hash_type: AGGRON4.SCRIPTS.SUDT.HASH_TYPE,
                args: utils.computeScriptHash(toScript)
            }
        },
        data: utils.toBigUInt128LE(amount),
    };
}




