import {Cell, HexNumber, OutPoint} from "@ckb-lumos/base";
import {request} from "../service/index";
import {IndexerTransaction, IndexerTransactionList, SearchKeyFilter, Terminator} from "../service/type";
import {CKB_LIGHT_RPC_URL, indexer, rpcCLient} from "../config/config";
import {BI, Indexer} from "@ckb-lumos/lumos";
import {Hexadecimal, HexString} from "@ckb-lumos/base/lib/primitive";
import {fetchTransactionUntilFetched} from "../service/txService";

const ckbLightClientRPC = CKB_LIGHT_RPC_URL;

const DefaultTerminator: Terminator = () => {
    return {stop: false, push: true};
};

// const script = {
//   code_hash:
//     "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
//   hash_type: "type",
//   args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
// };
export interface ScriptMsg {
    script: ScriptObject
    script_type: "lock" | "type"
    block_number: string
}


export interface ScriptObject {
    code_hash: string;
    hash_type: string | null | undefined;
    args: string | null | undefined;
}

//{
//       script,
//       script_type: script_type
//     },
//     "asc",
//     "0x6400000",
export interface SearchKey {
    script: ScriptObject,
    script_type: "lock" | "type"
    filter?: SearchFilter
    with_data?: boolean
}

export interface GetTransactionsSearchKey {
    script: ScriptObject,
    script_type: "lock" | "type"
    filter?: SearchFilter
    group_by_transaction?: boolean
}

export interface SearchFilter {
    script?: ScriptObject
    script_len_range?: HexString[]
    output_data_len_range?: HexString[]
    output_capacity_range?: HexString[]
    block_range?: HexString[]
}

export interface GetCellsRequest {
    search_key: SearchKey
    order: "asc" | "desc"
    limit: HexString
    after_cursor?: HexString
}

export interface GetCellsCapacityReq {
    search_key: SearchKey
}

/**
 * @description: set_scripts
 * @param {script{code_hash,hash_type,args}}
 * @return {any}
 */

export async function setScripts(scripts: ScriptMsg[]) {
    const res = await request(1, ckbLightClientRPC, "set_scripts", [
        scripts
    ]);
    return res;
}

/**
 * @description: get_tip_header
 * @param {[]}
 * @return {header}
 */
export async function getTipHeader(ckbLightClient: string = ckbLightClientRPC) {
    const res = await request(1, ckbLightClient, "get_tip_header", []);
    return res;
}

/**
 * @description: get_scripts
 * @return {any}
 * @param ckbLightClient
 */
export async function getScripts(ckbLightClient: string = ckbLightClientRPC) {
    const res = await request(1, ckbLightClient, "get_scripts", []);
    return res;
}

export async function waitScriptsUpdate(block_num: BI, ckbLightClient: string = ckbLightClientRPC) {
    while (true) {
        let res = await getScripts(ckbLightClient)
        if (res.length == 0) {
            return
        }
        // get lowest blocker
        let lower_block_num = BI.from("0xffffffffff")
        for (let i = 0; i < res.length; i++) {
            if (lower_block_num.gt(res[i].block_number)) {
                lower_block_num = BI.from(res[i].block_number);
            }
        }
        console.log('[waitScriptsUpdate] current get script Height:', lower_block_num.toNumber(), ",wait sync height:", block_num.toNumber(),)

        if (block_num.lte(lower_block_num)) {
            return
        }
        await sleep(3000)
    }
}

export async function getCellsCapacityRequest(getCellsReq: GetCellsCapacityReq, ckbLightClient: string = ckbLightClientRPC) {

    let request1 = [
        getCellsReq.search_key];
    const res = await request(2, ckbLightClient, "get_cells_capacity", request1);
    return {
        block_hash: res.block_hash,
        block_number: res.block_number,
        capacity: res.capacity
    }
}

export async function getCellsCapacity(script?: ScriptObject, ckbLightClient: string = ckbLightClientRPC, script_type = "lock") {

    let get_cells_capacity_request = {
        script: script,
        script_type: script_type,
        // filter?:filter,
    }
    const res = await request(2, ckbLightClient, "get_cells_capacity", [get_cells_capacity_request]);
    console.log('res:', res)
    return res
}

//[
//         {
//             "script": {
//                 "code_hash": "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
//                 "hash_type": "type",
//                 "args": "0x2a49720e721553d0614dff29454ee4e1f07d0707"
//             },
//             "script_type": "lock",
//             "filter": {
//                 "script_len_range": ["0x0", "0x1"]
//             }
//         },
//         "asc",
//         "0x64"
//     ]


export async function getCellsRequest(getCellsReq: GetCellsRequest, ckbLightClient: string = ckbLightClientRPC) {
    const infos: Cell[] = [];
    let request1 = [
        getCellsReq.search_key, getCellsReq.order, getCellsReq.limit];
    if (getCellsReq.after_cursor != undefined) {
        request1.push(getCellsReq.after_cursor)
    }
    const res = await request(2, ckbLightClient, "get_cells", request1);
    const liveCells = res.objects;
    for (const liveCell of liveCells) {
        const cell: Cell = {
            cell_output: liveCell.output,
            data: liveCell.output_data,
            out_point: liveCell.out_point,
            block_number: liveCell.block_number
        };
        // const { ok , push } = DefaultTerminator(index, cell);
        // if (push) {
        infos.push(cell);
        // }
    }

    return {
        objects: infos,
        lastCursor: res.last_cursor
    };
}

/**
 * @description: get_cells
 */
export async function getCells(script?: ScriptObject, script_type = "lock", ckbLightClient: string = ckbLightClientRPC) {
    const infos: Cell[] = [];
    let get_cells_request = [
        {
            script,
            script_type: script_type
        },
        "asc",
        "0xfff",
    ]
    console.log('script:', script)
    const res = await request(2, ckbLightClient, "get_cells", get_cells_request);

    const liveCells = res.objects;
    let index = 0;
    for (const liveCell of liveCells) {
        const cell: Cell = {
            cell_output: liveCell.output,
            data: liveCell.output_data,
            out_point: liveCell.out_point,
            block_number: liveCell.block_number
        };
        // const { ok , push } = DefaultTerminator(index, cell);
        // if (push) {
        infos.push(cell);
        // }
        index = index + 1;
    }

    return {
        objects: infos,
        lastCursor: index
    };
    //   return res;
}


/**
 * @description: get_transactions
 */


export async function getTransactions(searchKey: GetTransactionsSearchKey, searchKeyFilter: SearchKeyFilter = {}, url: string = ckbLightClientRPC,
): Promise<IndexerTransactionList> {

    let infos: IndexerTransaction[] = [];
    let cursor: string | undefined = searchKeyFilter.lastCursor;
    const sizeLimit = searchKeyFilter.sizeLimit || 100;
    const order = searchKeyFilter.order || "asc";
    while (true) {
        const params = [searchKey, order, `0x${sizeLimit.toString(16)}`, cursor];
        const res = await request(2, url, "get_transactions", params);
        const txs = res.objects;
        cursor = res.last_cursor as string;
        infos = infos.concat(txs);
        if (txs.length <= sizeLimit) {
            break;
        }
    }
    return {
        objects: infos,
        lastCursor: cursor,
    };
}

export async function fetch_header(block_hash: string, ckbLightClient: string = ckbLightClientRPC) {
    const res = await request(2, ckbLightClient, "fetch_header", [block_hash]);
    return res
}


export async function fetch_transaction(tx_hash: string, ckbLightClient: string = ckbLightClientRPC) {
    const res = await request(2, ckbLightClient, "fetch_transaction", [tx_hash]);

    return res
}

// const get_cells_capacity_params = [
//   {
//     script,
//     script_type: "lock"
//   }
// ];

// /**
//  * @description: get_cells_capacity
//  */
// export async function getCellsCapacity() {
//   const res = await request(
//     2,
//     ckbLightClientRPC,
//     "get_cells_capacity",
//     get_cells_capacity_params
//   );
//   return res;
// }

/**
 * @description: get_transaction
 */
export async function getTransaction(hash: string, ckbLightClient: string = ckbLightClientRPC) {
    const res = await request(1, ckbLightClient, "get_transaction", [hash]);
    return res;
}


async function sleep(timeOut: number) {
    await new Promise(r => setTimeout(r, timeOut));
}


/**
 * @description: get_header
 */
export async function getHeader(hash: string, ckbLightClient: string = ckbLightClientRPC) {
    const res = await request(1, ckbLightClient, "get_header", [hash]);
    return res;
}

/**
 * @description: get_peers
 */
export async function getPeers(ckbLightClient: string = ckbLightClientRPC) {
    const res = await request(1, ckbLightClient, "get_peers", []);
    return res;
}

/**
 * @description: send_transaction
 */
export async function sendTransaction(tx: any, ckbLightClient: string = ckbLightClientRPC) {
    const res = await request(1, ckbLightClient, "send_transaction", [tx]);
    return res;
}

export async function getGenesisBlock(ckbLightClient: string = ckbLightClientRPC) {
    return await request(1, ckbLightClient, "get_genesis_block", [])
}
