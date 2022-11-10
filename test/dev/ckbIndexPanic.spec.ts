import {
    cleanAllEnv,
    cut_miner_and_wait_lightClient_sync, getCapMsg,
    miner_block_number,
    miner_block_until_number, restartAndSyncCkbIndex
} from "../../service/CkbDevService";
import {rpcDevCLient} from "../../config/config";
import {BI} from "@ckb-lumos/bi";

describe('ckb-index', function () {

    this.timeout(100000_000)

    it("ckb-index panic test ", async () =>{
        // await cleanAllEnv()
        await restartAndSyncCkbIndex()
        await miner_block_until_number(1000 )
        let tip_num = await rpcDevCLient.get_tip_block_number()
        if (BI.from(tip_num).gt(1090)){
            console.log("tip num too height ,plseae clean clean and restart")
            return
        }
        await cut_miner_and_wait_lightClient_sync(90, 91)
        console.log("log dir: tmp/startBlockchain/ckbDevWithIndexAndeLightClient/ckb-indexer/target/release/node.log")
        await getCapMsg()

    })

});
