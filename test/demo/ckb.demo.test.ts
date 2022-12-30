import {CKB_LIGHT_RPC_URL, CKB_RPC_INDEX_URL, lightClientRPC, MINER_SCRIPT3, rpcCLient} from "../../config/config";
import {BI} from "@ckb-lumos/bi";
import {getTransactionsLength} from "../scenes.test";
import {getCellsCapacityRequest, waitScriptsUpdate} from "../../service/lightService";

describe('demo', function () {

    this.timeout(100000000)
    it('dd',async ()=>{
        console.log('demo')
        let response = await lightClientRPC.getCells(
            {
                scriptType:"lock",
                script:{
                    codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                    hashType: "type",
                    args: "0x5989ae415bb667931a99896e5fbbfad9ba53a223"
                },
            },
            "asc",
            "0x64"
            // after_cursor:"0x0",
        )
        console.log('response:',response)
        console.log('end')
    })

    it('setScript ',async ()=>{

        // await setScripts([{
        //     script:MINER_SCRIPT3,
        //     block_number:"0x0"
        // }])
        // for (let i = 0; i < 1000000000; i++) {
        //
        // }

        await waitScriptsUpdate(BI.from(await rpcCLient.getTipBlockNumber()))

    })
    it('get dd',async ()=>{
        for (let i = 0; i < 10000000; i++) {
            let capOfLight=  await getCellsCapacityRequest({
                script:MINER_SCRIPT3,
                scriptType:"lock"
            })
            let txLength = await getTransactionsLength(MINER_SCRIPT3,undefined,CKB_LIGHT_RPC_URL)
            console.log('light cap:',BI.from(capOfLight).toNumber(),' length:',txLength)
        }

    })

});

// function getBlockNumByCell()
