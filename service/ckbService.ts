import {CKB_RPC_URL} from "../config/config";
import {request} from "./index";
import {formatter as paramsFmts} from "@ckb-lumos/rpc/lib/paramsFormatter";


export async function estimate_cycles(tx: any, ckbLightClient: string = CKB_RPC_URL) {
    const res = await request(1, ckbLightClient, "estimate_cycles", [
        paramsFmts.toRawTransaction(tx)
    ]);
    return res;
}

export async function send_transaction(tx: any, ckbLightClient: string = CKB_RPC_URL) {
    const res = await request(1, ckbLightClient, "send_transaction", [
        paramsFmts.toRawTransaction(tx)
    ]);
    return res;
}

export async function generate_epochs(epoch: any, ckbLightClient: string = CKB_RPC_URL) {
    const res = await request(1, ckbLightClient, "generate_epochs", [epoch]);
    return res;
}
