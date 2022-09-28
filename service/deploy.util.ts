import {BIish} from "@ckb-lumos/bi";
import {AGGRON4, generateAccountFromPrivateKey} from "./transfer";
import {BI, commons, hd, helpers, Indexer, RPC} from "@ckb-lumos/lumos";
import {deploy} from "@ckb-lumos/common-scripts";
import {Script, utils} from "@ckb-lumos/base";
import {ACCOUNT_PRIVATE, CKB_RPC_INDEX_URL, CKB_RPC_URL, FEE} from "../config/config";
import {TransactionSkeletonType} from "@ckb-lumos/helpers";



const ckbRpcUrl = CKB_RPC_URL;
const ckbRpcIndexUrl = CKB_RPC_INDEX_URL;
const rpc = new RPC(ckbRpcUrl);
const indexer = new Indexer(ckbRpcIndexUrl, ckbRpcUrl);

enum DeployType {
    data,
    typeId,
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

//todo change SCRIPTBINARY=> file path
export async function deployContract(privateKey: string, SCRIPTBINARY: Uint8Array,deployType:DeployType ): Promise<any> {


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

