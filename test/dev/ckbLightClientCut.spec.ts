import {
    cleanAndRestartCkbLightClientEnv,
    compare_cells_result,
    cut_miner_and_wait_lightClient_sync, getCapMsg, miner_block,
    miner_block_until_number, restartAndSyncCkbIndex, transferDevService
} from "../../service/CkbDevService";
import {expect} from "chai";
import {generateAccountFromPrivateKey, transfer} from "../../service/transfer";
import {ACCOUNT_PRIVATE, ACCOUNT_PRIVATE2, CKB_DEV_RPC_URL, rpcDevCLient} from "../../config/config";
import {checkScriptsInLightClient, getCellsCapacityRequest, setScripts, waitScriptsUpdate} from "../../rpc";
import {BI} from "@ckb-lumos/bi";
import {getTransactionWaitCommit} from "../../service/txService";

describe('rollback', function () {

    this.timeout(10000000)
    let miner = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)
    let acc2 = generateAccountFromPrivateKey(ACCOUNT_PRIVATE2);

    async function initLightClient() {
        if (!(await checkScriptsInLightClient([miner.lockScript, acc2.lockScript]))) {
            await setScripts([{
                script: miner.lockScript,
                script_type: "lock",
                block_number: "0x0"
            },
                {
                    script: acc2.lockScript,
                    script_type: "lock",
                    block_number: "0x0"
                }
            ])
        }

        let tip_num = await rpcDevCLient.get_tip_block_number()
        await waitScriptsUpdate(BI.from(tip_num))
    }

    it("cut 10 ,miner 11 ,check rollback succ", async () => {
        await cleanAndRestartCkbLightClientEnv()
        await miner_block_until_number(1050)
        await initLightClient()
        const result = await compare_cells_result(miner.lockScript)
        await cut_miner_and_wait_lightClient_sync(13, 14)
        const result2 = await compare_cells_result(miner.lockScript)
        expect(result).to.be.equal(true)
        expect(result2).to.be.equal(true)
    })

    it("cut 300 ,miner 400,check roll back ",async ()=>{
        await cleanAndRestartCkbLightClientEnv()
        await miner_block_until_number(3000)
        await initLightClient()
        const result = await compare_cells_result(miner.lockScript)
        await cut_miner_and_wait_lightClient_sync(4000, 4001)
        await restartAndSyncCkbIndex()
        const result2 = await compare_cells_result(miner.lockScript)
        expect(result).to.be.equal(true)
        expect(result2).to.be.equal(true)
    })

    it("transfer roll back ",async ()=>{
        await cleanAndRestartCkbLightClientEnv()
        await initLightClient()
        await transfer_cut_and_wait_light_sync(900)
        await restartAndSyncCkbIndex()
        let compareMiner = await compare_cells_result(miner.lockScript)
        let compareTo = await compare_cells_result(acc2.lockScript)
        let result = await getCapMsg()
        console.log("result:",result)
        expect(compareMiner).to.be.equal(true)
        expect(compareTo).to.be.equal(true)
        expect(result.acc2_light).to.be.equal(result.acc2_index)

    })


    async function transfer_cut_and_wait_light_sync(transfer_num: number) {
        await miner_block(false)
        let begin_tip_num = await rpcDevCLient.get_tip_block_number()
        let tx = await transferDevService.transfer({
            from: miner.address,
            to: acc2.address,
            amount: BI.from(transfer_num).toHexString(),
            privKey: ACCOUNT_PRIVATE,
        })

        await getTransactionWaitCommit(tx, CKB_DEV_RPC_URL, 10)
        await miner_block(false)
        await miner_block(false)
        await getTransactionWaitCommit(tx, CKB_DEV_RPC_URL, 10000)
        let tip = await rpcDevCLient.get_tip_block_number()
        await waitScriptsUpdate(BI.from(tip))
        const cap1 = await getCellsCapacityRequest({
            search_key: {
                script: acc2.lockScript,
                script_type: "lock",
            }
        })
        console.log("account 2 cap:", BI.from(cap1.capacity).toNumber())
        const end_tip_num = await rpcDevCLient.get_tip_block_number()
        let cut_num = BI.from(end_tip_num).sub(begin_tip_num).toNumber()
        await cut_miner_and_wait_lightClient_sync(cut_num, cut_num + 10)
    }

});
