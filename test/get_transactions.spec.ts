import {CKB_LIGHT_RPC_URL, lightClientRPC, rpcCLient} from "../config/config";
import {HexNumber, Script} from "@ckb-lumos/base";
import {ScriptType} from "@ckb-lumos/light-client/src/type";
import {waitScriptsUpdate} from "../service/lightService";
import {BI} from "@ckb-lumos/bi";

type TestLightClientScript = {
    script: Script;
    scriptType: ScriptType;
};
describe('get_transactions', function () {
    this.timeout(100000000)
    let test_scripts: TestLightClientScript[] = [
        {
            "script": {
                "codeHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "hashType": "data",
                "args": "0x"
            },
            "scriptType": "lock",
        }
    ]
    // before(async function () {
    //
    //     let txs = await rpcCLient.getTransactions({
    //         "script": test_scripts[0].script, "scriptType": test_scripts[0].scriptType,
    //         "groupByTransaction": true
    //     }, "asc", "0xfff")
    //     console.log(txs.objects[0].blockNumber)
    //     console.log(txs.objects[txs.objects.length - 1].blockNumber)
    //     await lightClientRPC.setScripts([
    //         {
    //             "script": test_scripts[0].script,
    //             "scriptType": test_scripts[0].scriptType,
    //             "blockNumber": txs.objects[txs.objects.length - 1].blockNumber
    //         }
    //     ])
    //     await waitScriptsUpdate(BI.from(txs.objects[0].blockNumber),CKB_LIGHT_RPC_URL)
    // })

    it("demo", async () => {

        let lightTxs = await lightClientRPC.getTransactions(
            {
                "script": test_scripts[0].script,
                "scriptType": test_scripts[0].scriptType,
                "groupByTransaction": true
            }, "asc", "0xfff"
        )
        let ckbTxs = await rpcCLient.getTransactions({
            "script": test_scripts[0].script, "scriptType": test_scripts[0].scriptType,
            "groupByTransaction": true
        }, "asc", "0xfff")
        console.log(lightTxs.objects.length)
        console.log(ckbTxs.objects.length)
        // (lightTxs.objects.length == ckbTxs.objects.length, "light txs length not equal ckb txs length")

    })

});
