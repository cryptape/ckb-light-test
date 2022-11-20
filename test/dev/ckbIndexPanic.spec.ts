import {
    cleanAllEnv,
    cut_miner_and_wait_lightClient_sync,
    miner_block_number,
    miner_block_until_number, restartAndSyncCkbIndex, truncate_to_block
} from "../../service/CkbDevService";
import {ACCOUNT_PRIVATE, CKB_DEV_INDEX_PATH, CKB_DEV_RPC_INDEX_URL, rpcDevCLient} from "../../config/config";
import {BI} from "@ckb-lumos/bi";
import {sh} from "../../service/node";
import {expect} from "chai";
import {Sleep} from "../../service/util";
import {generateAccountFromPrivateKey} from "../../service/transfer";
import {getCellsCapacityRequest} from "../../service/lightService";

describe('ckb-index', function () {

    this.timeout(100000_000)

    it("ckb-index panic test ", async () =>{
        // await cleanAllEnv()
        // await miner_block_until_number(1050 )
        // await truncate_to_block(1009)
        // await Sleep(1)
        await restartAndSyncCkbIndex()
        // await miner_block_until_number(3294)
        for (let i = 0; i < 1000; i++) {
            await cut_miner_and_wait_lightClient_sync(10, 15)
            await Sleep(5)
            try {
                await getCellsCapacityRequest(
                     {
                        script:generateAccountFromPrivateKey(ACCOUNT_PRIVATE).lockScript,
                        scriptType:"lock",
                    }
                , CKB_DEV_RPC_INDEX_URL)        }catch (e){
                console.log(e)
                await catCkbIndexLog()
                expect("").to.be.equal("failed")
            }
        }

    })

});

async function catCkbIndexLog(){
    await sh("cd "+CKB_DEV_INDEX_PATH+" && cat ckb-indexer.log")
}
