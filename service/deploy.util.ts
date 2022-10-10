import {BIish} from "@ckb-lumos/bi";
import {AGGRON4, generateAccountFromPrivateKey} from "./transfer";
import {BI, commons, hd, helpers, Indexer, RPC} from "@ckb-lumos/lumos";
import {deploy} from "@ckb-lumos/common-scripts";
import {Script, utils} from "@ckb-lumos/base";
import {ACCOUNT_PRIVATE, CKB_RPC_INDEX_URL, CKB_RPC_URL, FEE, rpcCLient} from "../config/config";
import {TransactionSkeletonType} from "@ckb-lumos/helpers";
import { readFileSync } from 'fs';

import { Reader } from "ckb-js-toolkit";


const ckbRpcUrl = CKB_RPC_URL;
const ckbRpcIndexUrl = CKB_RPC_INDEX_URL;
const rpc = new RPC(ckbRpcUrl);
const indexer = new Indexer(ckbRpcIndexUrl, ckbRpcUrl);

enum DeployType {
    data,
    typeId,
}


interface ScriptConfig {
    // if hash_type is type, code_hash is ckbHash(type_script)
    // if hash_type is data, code_hash is ckbHash(data)
    CODE_HASH: string;

    HASH_TYPE: "type" | "data";

    TX_HASH: string;
    // the deploy cell can be found at index of tx's outputs
    INDEX: string;

    // now deployWithX only supportted `code `
    DEP_TYPE: "dep_group" | "code";

    // empty
    SHORT_ID?: number;
}

export async function upgradeContract(privateKey:string, SCRIPTBINARY: Uint8Array,_typeId: Script):Promise<any>{
    let acc = generateAccountFromPrivateKey(privateKey)

    let deployResult = await deploy.generateUpgradeTypeIdDataTx(
        {
            cellProvider: indexer,
            scriptBinary: SCRIPTBINARY,
            fromInfo: acc.address,
            config: AGGRON4,
            typeId:_typeId,
        }
    )
    let txSkeleton = deployResult.txSkeleton
    // txSkeleton = subFee(txSkeleton)
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)?.message;
    const Sig = hd.key.signRecoverable(message!, ACCOUNT_PRIVATE);
    let tx1 = helpers.sealTransaction(txSkeleton, [Sig]);
    let tx =  await rpc.send_transaction(tx1, "passthrough");
    console.log('tx:',tx)
    return deployResult.scriptConfig


}

export async function deployContractByPath(privateKey:string,path:string,deployType:DeployType): Promise<ScriptConfig>{
    const contractBin = readFileSync(path);
    return deployContractByArray(privateKey,contractBin,deployType)
}

//todo change SCRIPT BINARY => file path
export async function deployContractByArray(privateKey: string, SCRIPTBINARY: Uint8Array,deployType:DeployType ): Promise<ScriptConfig> {


    let acc = generateAccountFromPrivateKey(privateKey)

    // let txSkeleton = helpers.TransactionSkeleton({cellProvider: indexer})
    let deployResult;

    switch (deployType) {
        case DeployType.data:
            deployResult = await deploy.generateDeployWithDataTx(
            {
                cellProvider: indexer,
                scriptBinary: SCRIPTBINARY,
                fromInfo: acc.address,
                config: AGGRON4,
            }
        );break
        case DeployType.typeId:
            deployResult = await deploy.generateDeployWithTypeIdTx(
                {
                    cellProvider: indexer,
                    scriptBinary: SCRIPTBINARY,
                    fromInfo: acc.address,
                    config: AGGRON4,
                }
            );break
        default:throw new Error("not support")
    }

    let txSkeleton = deployResult.txSkeleton
    // txSkeleton = subFee(txSkeleton)
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)?.message;
    const Sig = hd.key.signRecoverable(message!, ACCOUNT_PRIVATE);
    let tx1 = helpers.sealTransaction(txSkeleton, [Sig]);
    let tx =  await rpc.send_transaction(tx1, "passthrough");
    console.log('tx:',tx)
    return deployResult.scriptConfig
}

// async function getDeployConfigByHashAndIndex(txHash:string,index:BI,deployType:DeployType): ScriptConfig {
//     let txMsg = await  rpcCLient.get_transaction(txHash)
//     // txMsg.
//     switch (deployType) {
//         case DeployType.typeId:
//             const codeHash = getCodeHashByTypeId()
//             // return {
//             //     CODE_HASH:""
//             // }
//         case DeployType.data:
//         default:
//     }
//     return {
//         CODE_HASH: '0xe683b04139344768348499c23eb1326d5a52d6db006c0d2fece00a831f3660d7',
//         HASH_TYPE: 'data',
//         TX_HASH: '0xe212c89dbb374222aaf70e1fa583ae80207051ce9f0e9f644754566cb9f8fe66',
//         INDEX: '0x0',
//         DEP_TYPE: 'code'
//     }
// }


// function getScriptConfigByTypeHash(
//     txSkeleton: TransactionSkeletonType,
//     outputIndex: number
// ): ScriptConfig {
//     const typeScript = txSkeleton.outputs.get(outputIndex)!.cell_output.type!;
//     const codeHash = utils.computeScriptHash(typeScript);
//     const txHash = calculateTxHash(txSkeleton);
//     const scriptConfig: ScriptConfig = {
//         CODE_HASH: codeHash,
//         HASH_TYPE: "type",
//         TX_HASH: txHash,
//         INDEX: "0x0",
//         DEP_TYPE: "code",
//     };
//     return scriptConfig;
// }




function subFee(txSkeleton: TransactionSkeletonType): TransactionSkeletonType {
    txSkeleton.get("outputs").map(function (outPut, idx) {
        if (outPut.cell_output.type == null) {
            outPut.cell_output.capacity = BI.from(outPut.cell_output.capacity).sub(BI.from(FEE)).toHexString()
            txSkeleton.get("outputs").set(idx, outPut)
            return txSkeleton
        }
    })
    return txSkeleton
}


