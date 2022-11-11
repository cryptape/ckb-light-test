import {
    cleanAndRestartCkbLightClientEnv,
    compare_cells_result,
    cut_miner_and_wait_lightClient_sync, miner_block,
    miner_block_until_number, restartAndSyncCkbIndex, transferDevService
} from "../../service/CkbDevService";
import {expect} from "chai";
import {generateAccountFromPrivateKey, transfer} from "../../service/transfer";
import {
    ACCOUNT_PRIVATE,
    ACCOUNT_PRIVATE2,
    CKB_DEV_RPC_INDEX_URL,
    CKB_DEV_RPC_URL, CKB_LIGHT_RPC_URL,
    rpcDevCLient
} from "../../config/config";
import {checkScriptsInLightClient, getCellsCapacityRequest, setScripts, waitScriptsUpdate} from "../../rpc";
import {BI} from "@ckb-lumos/bi";
import {getTransactionWaitCommit} from "../../service/txService";

describe('rollback', function () {

    this.timeout(10000000)
    let miner = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)
    let acc2 = generateAccountFromPrivateKey(ACCOUNT_PRIVATE2);

    async function initLightClient() {
        if (!(await checkScriptsInLightClient([miner.lockScript, acc2.lockScript]))) {
            await setScripts([
                {
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
        // for (let i = 0; i < 100; i++) {
            const result = await compare_cells_result(miner.lockScript)
            await cut_miner_and_wait_lightClient_sync(13, 14)
            const result2 = await compare_cells_result(miner.lockScript)
            expect(result).to.be.equal(true)
            expect(result2).to.be.equal(true)
        // }
    })

    it("cut 300 ,miner 400,check roll back ", async () => {
        await cleanAndRestartCkbLightClientEnv()
        await miner_block_until_number(500)
        await initLightClient()

        // for (let i = 0; i < 100; i++) {
            const result = await compare_cells_result(miner.lockScript)
            await cut_miner_and_wait_lightClient_sync(300, 400)
            await restartAndSyncCkbIndex()
            const result2 = await compare_cells_result(miner.lockScript)
            expect(result).to.be.equal(true)
            expect(result2).to.be.equal(true)
        // }
    })

    it("transfer roll back ", async () => {
        await miner_block_until_number(1500)
        await cleanAndRestartCkbLightClientEnv()
        await initLightClient()
        for (let i = 0; i < 2; i++) {
            await transfer_cut_and_wait_light_sync(900)
            await restartAndSyncCkbIndex()
            let compareMiner = await compare_cells_result(miner.lockScript)
            let compareTo = await compare_cells_result(acc2.lockScript)
            let result = await getCapMsg()
            console.log("result:", result)
            // expect(compareMiner).to.be.equal(true)
            // expect(compareTo).to.be.equal(true)
            expect(result.acc2_light).to.be.equal(result.acc2_index)
        }

    })

    async function getCapMsg() {
        const acc1Index = await getCellsCapacityRequest({
            search_key: {
                script: miner.lockScript,
                script_type: "lock",
            }
        }, CKB_DEV_RPC_INDEX_URL)
        const accLight = await getCellsCapacityRequest({
            search_key: {
                script: miner.lockScript,
                script_type: "lock",
            }
        }, CKB_LIGHT_RPC_URL)

        const acc2Index = await getCellsCapacityRequest({
            search_key: {
                script: acc2.lockScript,
                script_type: "lock",
            }
        }, CKB_DEV_RPC_INDEX_URL)
        const acc2Light = await getCellsCapacityRequest({
            search_key: {
                script: acc2.lockScript,
                script_type: "lock",
            }
        }, CKB_LIGHT_RPC_URL)
        return {
            miner_Index: BI.from(acc1Index.capacity).toNumber(),
            miner_light: BI.from(accLight.capacity).toNumber(),
            acc2_index: BI.from(acc2Index.capacity).toNumber(),
            acc2_light: BI.from(acc2Light.capacity).toNumber()
        }
    }


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
