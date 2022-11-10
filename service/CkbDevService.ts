import {
    ACCOUNT_PRIVATE, ACCOUNT_PRIVATE2, CKB_DEV_INDEX_PATH, CKB_DEV_LIGHT_CLIENT_PATH, CKB_DEV_PATH,
    CKB_DEV_RPC_INDEX_URL,
    CKB_DEV_RPC_URL,
    CKB_LIGHT_RPC_URL, CKB_RPC_INDEX_URL, DEV_PATH,
    rpcDevCLient
} from "../config/config";
import {BI} from "@ckb-lumos/bi";
import {getCellsCapacityRequest, ScriptObject, waitScriptsUpdate} from "../rpc";
import {request} from "./index";
import {getCellsByRange} from "./txService";
import {generateAccountFromPrivateKey, TransferService} from "./transfer";
import {sh, shWithTimeout, shWithTimeOutNotErr} from "./node";
import {Sleep} from "./util";

export const transferDevService = new  TransferService(CKB_DEV_RPC_URL,CKB_DEV_RPC_INDEX_URL)
export async function cut_miner_and_wait_lightClient_sync(cut_num: number, miner_num: number) {
    const before_cut_tip_height = await rpcDevCLient.get_tip_block_number()
    if (BI.from(before_cut_tip_height).toNumber() < cut_num) {
        await miner_block_number(cut_num - BI.from(before_cut_tip_height).toNumber())
    }

    await cut_number(cut_num)
    await miner_block_number(miner_num)
    let tip_num = await rpcDevCLient.get_tip_block_number()
    await waitScriptsUpdate(BI.from(tip_num))
}

export async function compare_cells_result(scriptObject1: ScriptObject) {
    let compare = true;
    const indexCells = await getCellsMsg(scriptObject1, CKB_DEV_RPC_INDEX_URL)
    console.log("lightCells:")
    const lightCells = await getCellsMsg(scriptObject1, CKB_LIGHT_RPC_URL)
    // get indexCells but not in light
    const indexNotInLightCells = indexCells.filter(cell => !lightCells.some(lightCell => {
        return lightCell.block_number == cell.block_number &&
            lightCell.out_point?.tx_hash == cell.out_point?.tx_hash
    }))

    // get lightCells but not in index
    const lightNotInIndexCells = lightCells.filter(cell => !indexCells.some(indexCell => {
        return indexCell.block_number == cell.block_number &&
            indexCell.out_point?.tx_hash == cell.out_point?.tx_hash
    }))
    if (indexNotInLightCells.length != 0) {

        compare = false
        console.log("indexNotInLightCells")
        indexNotInLightCells.forEach(cell => {
            console.log(
                "blockNum:", BI.from(cell.block_number).toNumber(),
                " hash:", cell.out_point?.tx_hash,
                " index:", cell.out_point?.index
            )
        })

    }
    if (lightNotInIndexCells.length != 0) {
        compare = false
        console.log("lightNotInIndexCells")
        lightNotInIndexCells.forEach(cell => {
            console.log(
                "blockNum:", BI.from(cell.block_number).toNumber(),
                " hash:", cell.out_point?.tx_hash,
                " index:", cell.out_point?.index
            )
        })
    }
    return compare
}

export async function cut_number(cut_number: number) {
    const tip_number = BI.from(await rpcDevCLient.get_tip_block_number()).toNumber()
    const reset_num = tip_number - cut_number
    const hash = await rpcDevCLient.get_block_hash(BI.from(reset_num).toHexString())
    await truncate(CKB_DEV_RPC_URL, hash)
}

export async function truncate(url, hash: string) {
    await request(100, url, "truncate", [hash])
}

export async function miner_block_until_number(end_number: number) {

    for (let i = 0; i < 10000; i++) {
        await miner_block()
        const tip_number = BI.from(await rpcDevCLient.get_tip_block_number()).toNumber()
        if (tip_number > end_number) {
            return
        }
        console.log("[miner]current:" + tip_number + ", expected:", end_number)
    }

}

export async function miner_block_number(height: number) {
    const begin_number = BI.from(await rpcDevCLient.get_tip_block_number()).toNumber()
    const end_number = begin_number + height
    await miner_block_until_number(end_number)
}

export async function getCellsMsg(scriptObject1: ScriptObject, url: string) {
    const tip_number = await rpcDevCLient.get_tip_block_number();
    let cells = await getCellsByRange(scriptObject1, "lock", undefined, url, ["0x0", BI.from(tip_number).toHexString()])
    cells.forEach(tx => console.log(
        "blockNum:", BI.from(tx.block_number).toNumber(),
        " hash:", tx.out_point?.tx_hash,
        " index:", tx.out_point?.index
    ))
    return cells

}

export async function getCapMsg() {
    let acc1 = generateAccountFromPrivateKey(ACCOUNT_PRIVATE);
    let acc2 = generateAccountFromPrivateKey(ACCOUNT_PRIVATE2);
    const acc1Index = await getCellsCapacityRequest({
        search_key: {
            script: acc1.lockScript,
            script_type: "lock",
        }
    }, CKB_DEV_RPC_INDEX_URL)
    const accLight = await getCellsCapacityRequest({
        search_key: {
            script: acc1.lockScript,
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
        acc1_Index: BI.from(acc1Index.capacity).toNumber(),
        acc1_light: BI.from(accLight.capacity).toNumber(),
        acc2_index: BI.from(acc2Index.capacity).toNumber(),
        acc2_light: BI.from(acc2Light.capacity).toNumber()
    }
}


export async function miner_block(kill_port: boolean = true) {
    if (kill_port) {
        await shWithTimeOutNotErr("lsof -i:8888 | grep LIS  | awk '{print $2}'| xargs -n1 kill -9 && cd " + CKB_DEV_PATH + " && ./ckb miner -C dev > block.log", 2000)
    } else {
        await shWithTimeOutNotErr(" cd " + CKB_DEV_PATH + " && ./ckb miner -C dev > block.log", 2000)
    }
    await shWithTimeOutNotErr("cat " + CKB_DEV_PATH + "/block.log | grep Found", 1000)
}

export async function cleanCkbLightClientEnv() {
    await sh("cd " + DEV_PATH + " && rm -rf ckb-light-client/target/release/data")
}

export async function stopCkbLightClient() {
    await shWithTimeOutNotErr("pkill ckb-light-client",1000)
}

export async function startCkbLightClient() {
    await sh("cd " + CKB_DEV_LIGHT_CLIENT_PATH +" && RUST_LOG=info,ckb_light_client=trace ./ckb-light-client run --config-file ./config.toml > node.log 2>&1 &")
}

export async function cleanAndRestartCkbLightClientEnv() {
    await stopCkbLightClient()
    await cleanCkbLightClientEnv()
    await startCkbLightClient()
}

export async function cleanAllEnv() {
    await sh("cd " + DEV_PATH + " && sh clean.sh")
}

export async function startEnv() {
    await shWithTimeout("cd " + DEV_PATH + " sh start.sh", 100_000)
}

export async function restartAndSyncCkbIndex() {
    await sh("cd " + CKB_DEV_INDEX_PATH + " && pkill ckb-indexer && rm -rf ckb-test && RUST_LOG=info ./ckb-indexer -s ckb-test > ckb-indexer.log 2>&1 &")
    await checkCKbIndexSync()
}

export async function checkCKbIndexSync() {
    let acc1 = generateAccountFromPrivateKey(ACCOUNT_PRIVATE);
    let tip_num = await rpcDevCLient.get_tip_block_number()
    for (let i = 0; i < 1000; i++) {
        let cap = await getCellsCapacityRequest({
            search_key: {
                script: acc1.lockScript,
                script_type: "lock"
            }
        },CKB_DEV_RPC_INDEX_URL)
        if (BI.from(tip_num).lte(BI.from(cap.block_number))) {
            return
        }
        console.log("current sync:", BI.from(cap.block_number).toNumber(), " expected:", BI.from(tip_num).toNumber())
        await Sleep(1000)
    }
}
