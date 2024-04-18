import {BI} from "@ckb-lumos/bi";
import {CKB_LIGHT_RPC_URL, lightClientRPC} from "../config/config";
import {LightClientRPC} from "@ckb-lumos/light-client";
import {Sleep} from "./util";
import {request} from "./index";
import {HexString, Script} from "@ckb-lumos/base";
import {Cell} from "@ckb-lumos/base/lib/api";
import {
    toGetCellsSearchKey,
} from "@ckb-lumos/ckb-indexer/lib/paramsFormatter";
import {GetCellsSearchKey, SearchKey} from "@ckb-lumos/ckb-indexer/lib/type";
import {RPC} from "@ckb-lumos/lumos";
import {LightClientScript} from "@ckb-lumos/light-client/src/type";

const ckbLightClientRPC = CKB_LIGHT_RPC_URL;

export interface GetCellsRequest {
    searchKey: GetCellsSearchKey
    order: "asc" | "desc"
    limit: HexString
    afterCursor?: HexString
}

export async function getGenesisBlock(ckbLightClient: string = ckbLightClientRPC) {
    return await request(1, ckbLightClient, "get_genesis_block", [])
}

export async function getHeader(hash: string, ckbLightClient: string = ckbLightClientRPC) {
    const res = await request(1, ckbLightClient, "get_header", [hash]);
    return res;
}

export async function getTransaction(hash: string, ckbLightClient = ckbLightClientRPC) {
    return await request(1, ckbLightClient, "get_transaction", [hash])

}

export async function getCellsCapacityRequest(getCellsReq: SearchKey, ckbLightClient: string = ckbLightClientRPC) {

    let request1 = [toGetCellsSearchKey(getCellsReq)];
    const res = await request(2, ckbLightClient, "get_cells_capacity", request1);
    return {
        blockHash: res.block_hash,
        blockNumber: res.block_number,
        capacity: res.capacity
    }
}

export async function sendTransaction(tx: any, ckbLightClient: string = ckbLightClientRPC) {
    const client = new RPC(ckbLightClient);
    const res = await client.sendTransaction(tx);
    return res;
}


export async function waitScriptsUpdateWithTime(block_num: BI, ckbLightClient: string = ckbLightClientRPC, timeOut: number) {
    const lightClientRPC = new LightClientRPC(ckbLightClient)

    while (timeOut > 0) {
        timeOut--;
        let res = await lightClientRPC.getScripts()
        // @ts-ignore
        if (res.length == 0) {
            return
        }
        // get lowest blocker
        let lower_block_num = BI.from("0xffffffffff")
        // @ts-ignore
        for (let i = 0; i < res.length; i++) {
            if (lower_block_num.gt(res[i].blockNumber)) {
                lower_block_num = BI.from(res[i].blockNumber);
            }
        }
        console.log('[waitScriptsUpdate] current get script Height:', lower_block_num.toNumber(), ",wait sync height:", block_num.toNumber(),)
        if (block_num.lte(lower_block_num)) {
            return
        }
        await Sleep(1000)
    }
    throw new Error(`waitScriptsUpdateWithTime time out`)
}

export async function getLightSyncHeight(ckbLightClient: string = ckbLightClientRPC): Promise<BI> {

    const lightClientRPC = new LightClientRPC(ckbLightClient)
    let res = await lightClientRPC.getScripts()
    if (res.length == 0) {
        return BI.from("0")
    }
    let lower_block_num = BI.from(res[0].blockNumber);
    for (let i = 0; i < res.length; i++) {
        if (lower_block_num.gt(res[i].blockNumber)) {
            lower_block_num = BI.from(res[i].blockNumber);
        }
    }
    return lower_block_num;

}

export async function waitScriptsUpdate(block_num: BI, ckbLightClient: string = ckbLightClientRPC) {
    const lightClientRPC = new LightClientRPC(ckbLightClient)

    while (true) {
        let res = await lightClientRPC.getScripts()
        // @ts-ignore
        if (res.length == 0) {
            return
        }
        // get lowest blocker
        let lower_block_num = BI.from("0xffffffffff")
        // @ts-ignore
        for (let i = 0; i < res.length; i++) {
            if (lower_block_num.gt(res[i].blockNumber)) {
                lower_block_num = BI.from(res[i].blockNumber);
            }
        }
        console.log('[waitScriptsUpdate] current get script Height:', lower_block_num.toNumber(), ",wait sync height:", block_num.toNumber(),)

        if (block_num.lte(lower_block_num)) {
            return
        }
        await Sleep(3000)
    }
}


export async function checkScriptsInLightClient(scripts: Script[], ckbLightClient: string = ckbLightClientRPC) {
    let res = await lightClientRPC.getScripts()

    let getScriptList = res.map(result => {
        return {
            codeHash: result.script.codeHash,
            hashType: result.script.hashType,
            args: result.script.args
        }
    })

    return scripts.some(checkScript => {
        return getScriptList.some(getScript => {
            return getScript.codeHash == checkScript.codeHash &&
                getScript.hashType == checkScript.hashType &&
                getScript.args == checkScript.args
        })
    })
}

export async function getCellsRequest(getCellsReq: GetCellsRequest, ckbLightClient: string = ckbLightClientRPC) {
    const lightRpc = new LightClientRPC(ckbLightClient)
    const infos: Cell[] = [];
    let res = await lightRpc.getCells(getCellsReq.searchKey, getCellsReq.order, getCellsReq.limit, getCellsReq.afterCursor)
    const liveCells = res.objects;
    for (const liveCell of liveCells) {
        const cell: Cell = {
            cellOutput: liveCell.output,
            data: liveCell.outputData,
            outPoint: liveCell.outPoint,
            blockNumber: liveCell.blockNumber
        };
        infos.push(cell);
    }
    return {
        objects: infos,
        lastCursor: res.lastCursor
    };
}


export async function setScriptWithCommand(ckb_light_rpc_url: string, scripts: Array<LightClientScript>, setScriptCommand: "all" | "partial" | "delete" | "partial1") {
    const params = [
        scripts.map(({script, scriptType, blockNumber}) => ({
            script: {
                code_hash: script.codeHash,
                hash_type: script.hashType,
                args: script.args,
            },
            script_type: scriptType,
            block_number: blockNumber,
        })), setScriptCommand
    ];
    return request(1, ckb_light_rpc_url, "set_scripts", params)
}

