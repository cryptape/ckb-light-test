import { Cell } from "@ckb-lumos/base";
import { request } from "../service/index";
import { IndexerTransaction, Terminator } from "../service/type";
import {CKB_LIGHT_RPC_URL} from "../config/config";
import {BI} from "@ckb-lumos/lumos";

const ckbLightClientRPC = CKB_LIGHT_RPC_URL;

const DefaultTerminator: Terminator = () => {
  return { stop: false, push: true };
};

// const script = {
//   code_hash:
//     "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
//   hash_type: "type",
//   args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
// };
interface ScriptMsg{
  script:ScriptObject
  block_number:string
}

interface ScriptObject {
  code_hash: string;
  hash_type: string|null|undefined;
  args: string|null|undefined;
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
export async function getTipHeader(ckbLightClient:string=ckbLightClientRPC) {
  const res = await request(1, ckbLightClient, "get_tip_header", []);
  return res;
}

/**
 * @description: get_scripts
 * @return {any}
 * @param ckbLightClient
 */
export async function getScripts(ckbLightClient:string=ckbLightClientRPC) {
  const res = await request(1, ckbLightClient, "get_scripts", []);
  return res;
}

export async function waitScriptsUpdate(block_num:BI,ckbLightClient:string=ckbLightClientRPC){
  while (true){
    let res = await getScripts(ckbLightClient)
    if (res.length==0){
      return
    }
    // get lowest blocker
    let lower_block_num = BI.from("0xffffffffff")
    for (let i = 0; i < res.length; i++) {
      if(lower_block_num.gt(res[i].block_number)){
        lower_block_num = res[i].block_number;
      }
    }
    if (block_num.lte(lower_block_num)){
      return
    }
    await sleep(3000)
  }
}

export async function getCellsCapacity(script?:ScriptObject,ckbLightClient:string=ckbLightClientRPC,script_type="lock"){

  let get_cells_capacity_request = {
    script:script,
    script_type:script_type,
    // filter?:filter,
  }
  const res = await request(2, ckbLightClient, "get_cells_capacity", [get_cells_capacity_request]);
  console.log('res:',res)
  return res
}

/**
 * @description: get_cells
 */
export async function getCells(script?: ScriptObject,script_type="lock",ckbLightClient:string=ckbLightClientRPC) {
  const infos: Cell[] = [];
  let get_cells_request = [
    {
      script,
      script_type: script_type
    },
    "asc",
    "0x6400000",
  ]
  console.log('script:',script)
  const res = await request(2, ckbLightClient, "get_cells", get_cells_request);

    const liveCells = res.objects;
    let  index = 0;
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
      index= index+1;
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
export async function getTransactions(
  script: ScriptObject,
  lastCursor?: string
) {
  let infos: IndexerTransaction[] = [];
  let cursor: string | undefined;
  const sizeLimit = 500;
  const order = "desc"; //desc ｜ asc
  // 0x1e0 480
  const get_transactions_params: any = [
    {
      script,
      script_type: "lock",
      filter: script
      // group_by_transaction: true
    },
    order,
    "0x1e0"
  ];
  if (lastCursor) {
    get_transactions_params.push({ after_cursor: lastCursor });
  }

  const res = await request(
    2,
    ckbLightClientRPC,
    "get_transactions",
    get_transactions_params
  );
  while (true) {
    const txs = res.objects;
    cursor = res.last_cursor as string;
    infos = infos.concat(txs);
    if (txs.length <= sizeLimit) {
      break;
    }
  }
  return {
    objects: infos,
    lastCursor: cursor
  };
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
export async function getTransaction(hash: string,ckbLightClient:string=ckbLightClientRPC) {
  const res = await request(1, ckbLightClient, "get_transaction", [hash]);
  return res;
}


async function sleep(timeOut: number) {
  await new Promise(r => setTimeout(r, timeOut));
}


/**
 * @description: get_header
 */
export async function getHeader(hash: string,ckbLightClient:string=ckbLightClientRPC) {
  const res = await request(1, ckbLightClient, "get_header", [hash]);
  return res;
}

/**
 * @description: get_peers
 */
export async function getPeers(ckbLightClient:string=ckbLightClientRPC) {
  const res = await request(1, ckbLightClient, "get_peers", []);
  return res;
}

/**
 * @description: send_transaction
 */
export async function sendTransaction(tx: any,ckbLightClient:string=ckbLightClientRPC) {
  const res = await request(1, ckbLightClient, "send_transaction", [tx]);
  return res;
}
