import {ScriptMsg, setScripts, waitScriptsUpdate} from "../../rpc";
import {BI} from "@ckb-lumos/lumos";
import {CKB_LIGHT_RPC_URL, CKB_RPC_INDEX_URL, CkbClientNode} from "../../config/config";
import {getTransactionList} from "../../service/txService";

describe('issue', function () {



    this.timeout(1000_10000)
    it('getTransactions not eq',async ()=>{


        const testScriptMsg:ScriptMsg = {
            script:{
                code_hash:"0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
                hash_type:"type",
                args:"0x9032560e30de0fe07fe8489d022dde6d3d5920cf8b3a4d8fd64717a778741c30"
            },
            script_type:"type",
            block_number:BI.from("1755000").toHexString(),
        }


        await CkbClientNode.clean()
        await CkbClientNode.start()
        await setScripts([testScriptMsg])
        await waitScriptsUpdate(BI.from("1759625"))
        const lightTxs =  await getTransactionList(testScriptMsg.script,testScriptMsg.script_type,undefined,CKB_LIGHT_RPC_URL,[BI.from("1755000").toHexString(),BI.from("1759626").toHexString()])
        const indexTxs =  await getTransactionList(testScriptMsg.script,testScriptMsg.script_type,undefined,CKB_RPC_INDEX_URL,[BI.from("1755000").toHexString(),BI.from("1759626").toHexString()])
        console.log('---light txs----')
        lightTxs.forEach(x =>console.log(x))
        console.log('---index txs ---')
        indexTxs.forEach(x=>console.log(x))

    })
});
