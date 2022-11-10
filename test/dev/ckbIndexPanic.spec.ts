import {
    cut_miner_and_wait_lightClient_sync,
    miner_block_number,
    miner_block_until_number, restartAndSyncCkbIndex
} from "../../service/CkbDevService";

describe('ckb-index', function () {

    this.timeout(100000_000)

    it("ckb-index panic test ", async () =>{
        await miner_block_until_number(1000 )
        await cut_miner_and_wait_lightClient_sync(50, 90)
    })

});
