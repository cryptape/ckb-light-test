import {request} from "./index";
import {Sleep} from "./util";
import {Cell} from "@ckb-lumos/base/lib/api";
import {
    getCells,
    getCellsRequest,
    getTipHeader,
    getTransactions,
    ScriptObject,
    setScripts,
    waitScriptsUpdate
} from "../rpc";
import {BI, helpers} from "@ckb-lumos/lumos";
import {AGGRON4} from "./transfer";
import {FEE} from "../config/config";
import {SearchKeyFilter} from "./type";
import {HexString} from "@ckb-lumos/base/lib/primitive";


export async function fetchTransactionUntilFetched(hash: string, ckbLightClient, waitSize: number) {
    let res;
    for (let i = 0; i < waitSize; i++) {
        res = await request(1, ckbLightClient, "fetch_transaction", [hash]);
        if (res.status === 'fetched') {
            return res
        }
        console.log('fetch size:', i, ' fetch status:', res.status)
        await Sleep(1000)
    }
    throw new Error("time out ")
    return res
}

export async function getTransactionWaitCommit(hash: string, ckbLightClient, waitSize: number) {
    let res;
    for (let i = 0; i < waitSize; i++) {
        res = await request(1, ckbLightClient, "get_transaction", [hash]);
        if (res.tx_status.status === 'committed') {
            return res
        }
        await Sleep(1000)
    }
    return res
}

export async function setScriptContainsAllLiveOutPut(script: ScriptObject, ckbLightClient: string, ckbIndexUrl: string) {

    let cellObjs = await getCells(script, "lock", ckbIndexUrl)
    let cells = cellObjs.objects
    // if (cells.length <1){
    //     return
    // }
    await setScripts([{
        script: script,
        script_type: "lock",
        // block_number:BI.from(cells[0].block_number).sub(1).toHexString()
        block_number: BI.from(6630108).toHexString()
    }])
    let header = await getTipHeader(ckbLightClient)
    await waitScriptsUpdate(BI.from(header.number), ckbLightClient)
}

export async function getInputCellsByScript(script: ScriptObject, ckbLightClient: string, script_type = "lock"): Promise<Cell[]> {
    // export async function getCells(script?: ScriptObject,script_type="lock",ckbLightClient:string=ckbLightClientRPC) {

    let cells = await getCells(script, script_type, ckbLightClient)

    return cells.objects;
}


export function getTransferExtraLockCell(inputCell: Cell[], script: ScriptObject, extra: number = 1): Cell[] {
    const minCellBalance = 100 * 100000000
    let cells = []

    // get inputCell cap
    const totalCap = inputCell.reduce((total, cell) => {
        return total.add(BI.from(cell.cell_output.capacity))
    }, BI.from(0))

    // cap - fee
    const transferCap = totalCap.sub(FEE)
    // gen output cells

    const maxOutPutCellSize = transferCap.div(minCellBalance).sub(1).toNumber()

    if (maxOutPutCellSize <= 0) {
        throw new Error("cap not enough:" + transferCap.toNumber())
    }
    if (extra > maxOutPutCellSize) {
        extra = maxOutPutCellSize
    }
    for (let i = 0; i < extra - 1; i++) {
        cells.push({
            cell_output: {
                capacity: BI.from(100).mul(100000000).toHexString(),
                lock: script
            },
            data: '0x'
        })
    }
    // cells.push(
    //     {
    //         cell_output: {
    //             capacity: transferCap.sub(100 * 100000000 * (size - 1)).toHexString(),
    //             lock: script
    //         },
    //         data: '0x'
    //     }
    // )

    return cells

}

export async function getTransactionList(scriptObject: ScriptObject, script_type: "lock" | "type", lastCursor: string, url: string, block_range: HexString[] = []) {
    let txList = []
    while (true) {
        let result = await getTransactions({
            script: scriptObject,
            script_type: script_type,
            group_by_transaction: true,
            filter: {
                block_range: block_range
            }
        }, {sizeLimit: 10000, lastCursor: lastCursor}, url)
        if (result.objects.length == 0) {
            break
        }
        txList.push(...result.objects.map(tx => {
            if (tx.tx_hash != null) {
                return tx.tx_hash
            }
            return tx.transaction.hash
        }))
        lastCursor = result.lastCursor
        console.log('current totalSize:', txList.length, 'cursor:', lastCursor)
    }
    return txList
}

export async function getTransactionsLength(scriptObject: ScriptObject, script_type: "lock" | "type", lastCursor: string, url: string, block_range: HexString[] = []) {
    let totalSize = 0

    while (true) {
        let result = await getTransactions({
            script: scriptObject,
            script_type: script_type,
            group_by_transaction: true,
            filter: {
                block_range: block_range
            }
        }, {sizeLimit: 10000, lastCursor: lastCursor}, url)
        if (result.objects.length == 0) {
            break
        }
        totalSize += result.objects.length
        lastCursor = result.lastCursor
        console.log('current totalSize:', totalSize, 'cursor:', lastCursor)
    }
    return totalSize
}

// export async function fetchTransactionW
export async function getCellsByRange(scriptObject: ScriptObject, script_type: "lock" | "type", lastCursor: string, url: string, block_range: HexString[] = []): Promise<Cell[]> {
    let txList = []
    while (true) {
        let result = await getCellsRequest({
            limit: "0xfff",
            order: "asc", search_key: {
                script: scriptObject,
                script_type: script_type,
                filter: {
                    block_range: block_range
                }
            },
            after_cursor: lastCursor
        }, url)
        if (result.objects.length == 0) {
            break
        }
        for (let i = 0; i < result.objects.length; i++) {
            txList.push(result.objects[i])
        }
        lastCursor = result.lastCursor
        console.log('current totalSize:', txList.length, 'cursor:', lastCursor)
    }
    return txList


}
