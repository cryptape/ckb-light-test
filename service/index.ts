import { ScriptWrapper} from "@ckb-lumos/base";
import fetch from "cross-fetch";
import { RPC_DEBUG} from "../config/config";
const RPC_DEBUG_SERVICE = RPC_DEBUG

function instanceOfScriptWrapper(object: unknown): object is ScriptWrapper {
    return typeof object === "object" && object != null && "script" in object;
}



const requestBatch = async (rpcUrl: string, data: unknown): Promise<any> => {
    const res: Response = await fetch(rpcUrl, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/vnd.api+json"
        }
    });
    if (res.status !== 200) {
        throw new Error(`indexer request failed with HTTP code ${res.status}`);
    }
    const result = await res.json();
    if (result.error !== undefined) {
        throw new Error(
            `indexer request rpc failed with error: ${JSON.stringify(result.error)}`
        );
    }
    return result;
};

const requestGet = async (rpcUrl: string): Promise<any> => {
    const res: Response = await fetch(rpcUrl, {
        method: "GET",
        headers: {
            "Content-Type": "application/vnd.api+json"
        }
    });
    if (res.status !== 200) {
        throw new Error(`indexer request failed with HTTP code ${res.status}`);
    }
    const result = await res.json();
    if (result.error !== undefined) {
        throw new Error(
            `indexer request rpc failed with error: ${JSON.stringify(result.error)}`
        );
    }
    return result;
};

const request = async (
    id: number,
    ckbIndexerUrl: string,
    method: string,
    params?: any
): Promise<any> => {
    if (RPC_DEBUG_SERVICE) {
        console.log("curl --location --request POST '" + ckbIndexerUrl + "' \\\n" +
            "--header 'Content-Type: application/json' \\\n" +
            "--data-raw '{\n" +
            "\t\"jsonrpc\":\"2.0\",\n" +
            "\t\"method\":\"" + method + "\",\n" +
            "\t\"params\":" + JSON.stringify(params) + ",\n" +
            "\t\"id\":64\n" +
            "}'")
    }
    const res = await fetch(ckbIndexerUrl, {
        method: "POST",
        body: JSON.stringify({
            id,
            jsonrpc: "2.0",
            method,
            params
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (res.status !== 200) {
        throw new Error(`light client request failed with HTTP code ${res.status}`);
    }
    const data = await res.json();

    if (data.error !== undefined) {
        if (RPC_DEBUG_SERVICE) {
            console.log( JSON.stringify(data.error))
        }
        throw new Error(
            `light client request rpc failed with error: ${JSON.stringify(
                data.error
            )}`
        );
    }
    if (RPC_DEBUG_SERVICE) {
        console.log( JSON.stringify(data.result))
    }
    return data.result;
};

export {
    instanceOfScriptWrapper,
    requestBatch,
    request,
    requestGet
};
