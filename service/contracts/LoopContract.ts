import {estimate_cycles} from "../ckbService";
import {deployContractByPath, DeployType, ScriptConfig} from "../deploy.util";
import {Account, AGGRON4, buildTx, generateAccountFromPrivateKey, send_tx_options, transfer} from "../transfer";
import {Hash, HexNumber, HexString} from "@ckb-lumos/base/lib/primitive";
import {helpers} from "@ckb-lumos/lumos";
import {BI} from "@ckb-lumos/bi";
import {utils} from "@ckb-lumos/base";
import {HashType} from "@ckb-lumos/base/lib/api";
import {Transaction} from "@ckb-lumos/base";

const codeFilePath = "/Users/guopenglin/WebstormProjects/gp10/ckb-light-test/service/contracts/my2"

export const LoopContractConfig: ScriptConfig = {
    CODE_HASH: "0x8a8eb94a4fb9c8fbd899f60cb3e0813cc5aca0e03af5c159ae4ede50fde03655",
    HASH_TYPE: "data1",
    TX_HASH: "0x406e2e33aab81ba91eb12e00419c1926d6f6113192fc18e6ae42cc4583a1781a",
    INDEX: "0x1",
    DEP_TYPE: "code"
}

export const ARG_CPU:HexString = "0x123456"
export  const ARG_MEM:HexString = "0x12"
export class LoopContract {

    sc: ScriptConfig;
    account: Account;
    privateKey: string;


    constructor(privateKey: string,sc?:ScriptConfig) {
        this.privateKey = privateKey
        this.account = generateAccountFromPrivateKey(this.privateKey)
        this.sc = sc
    }
    async deploy() :Promise<ScriptConfig>{
        if (this.sc == null){
            this.sc = await deployContractByPath(this.privateKey, codeFilePath, DeployType.data)
            console.log("deploy msg :",this.sc)
            return this.sc;
        }
        return this.sc;
    }

    buildTx(loopCount: number, type: HexString) :Promise<Transaction>{
        return  buildTx({
            from: this.account.address,
            outputCells: [this._gen_out_put_cell(loopCount, type),this._gen_out_put_cell(loopCount, type),this._gen_out_put_cell(loopCount, type)],
            privKey: this.privateKey,
            deps: [{
                outPoint: {
                    txHash: this.sc.TX_HASH,
                    index: this.sc.INDEX
                },
                depType: "code"
            }]
        })
    }

    _gen_out_put_cell(loopCount: number, type: HexString) {
        const toScript = helpers.parseAddress(this.account.address, {config: AGGRON4});
        return {
            cellOutput: {
                capacity: BI.from(1000).mul(100000000).toHexString(),
                lock: toScript,
                type: {
                    codeHash: this.sc.CODE_HASH,
                    hashType: this.sc.HASH_TYPE,
                    args: type
                }
            },
            data: utils.toBigUInt128LE(loopCount),
        };
    }

}
