import {
    Address,
    BI,
    Cell,
    commons,
    config,
    core,
    hd,
    helpers,
    Indexer,
    RPC,
    Script,
    toolkit,
    WitnessArgs,
} from "@ckb-lumos/lumos";
import {OutPoint, Transaction, values} from "@ckb-lumos/base";
import {
    EVERY_ONE_CAN_PAY,
    EVERY_ONE_CAN_PAY_TYPE_ID,
    CKB_LIGHT_RPC_URL, CKB_RPC_INDEX_URL,
    CKB_RPC_URL,
    FeeRate,
    rpcCLient
} from "../config/config";
import {CellDep} from "@ckb-lumos/base/lib/api";
import {ScriptMsg, sendTransaction, setScripts, waitScriptsUpdate} from "../rpc";
import {fetchTransactionUntilFetched} from "./txService";

const { ScriptValue } = values;

export const { AGGRON4 } = config.predefined;


const defaultRpc = new RPC(CKB_RPC_URL);
const defaultIndexer = new Indexer(CKB_RPC_INDEX_URL, CKB_RPC_URL);

export class TransferService {
    readonly defaultRpc :RPC;
    // @ts-ignore
    readonly defaultIndexer:Indexer;
    constructor(ckb_rpc_url: string,ckb_index_url:string) {
        this.defaultRpc = new RPC(ckb_rpc_url)
        this.defaultIndexer = new Indexer(ckb_index_url,ckb_rpc_url);
    }


    async capacityOf(address: string): Promise<BI> {
        const collector = this.defaultIndexer.collector({
            lock: helpers.parseAddress(address, { config: AGGRON4 }),
        });

        let balance = BI.from(0);
        for await (const cell of collector.collect()) {
            balance = balance.add(cell.cell_output.capacity);
        }
        return balance;
    }

     async transfer(options: transferOptions): Promise<string> {
        const transferOutput: Cell = getOutPutCell(options.to,options.amount,"0x");
        return this.send_tx({
            from:options.from,
            outputCells:[transferOutput],
            privKey:options.privKey,
        });
    }

    async send_tx(options: Options): Promise<string> {
        let txSkeleton = helpers.TransactionSkeleton({});
        const fromScript = helpers.parseAddress(options.from, { config: AGGRON4 });

        let neededCapacity = BI.from(0)
        for (let i = 0; i < options.outputCells.length; i++) {
            neededCapacity = neededCapacity.add(options.outputCells[i].cell_output.capacity)
        }
        let collectedSum = BI.from(0);
        const collected: Cell[] = [];
        const collector = this.defaultIndexer.collector({ lock: fromScript, type: "empty" });
        for await (const cell of collector.collect()) {
            collectedSum = collectedSum.add(cell.cell_output.capacity);
            collected.push(cell);
            if (collectedSum >= neededCapacity) break;
        }
        console.log('total cell balance: ',collectedSum.toString())

        if (collectedSum < neededCapacity) {
            throw new Error("Not enough CKB");
        }

        if(collectedSum.sub(neededCapacity).sub(FeeRate.NORMAL).gt(BI.from('0'))) {
            const changeOutput: Cell = {
                cell_output: {
                    capacity: collectedSum.sub(neededCapacity).sub(FeeRate.NORMAL).toHexString(),
                    lock: fromScript,
                },
                data: "0x",
            };
            console.log('gen out put extra value ')
            txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(changeOutput));
        }
        let SECP256K1_BLAKE160_HASH = (await this.defaultRpc.get_block_by_number("0x0")).transactions[1].hash
        console.log("SECP256K1_BLAKE160_HASH:",SECP256K1_BLAKE160_HASH)
        txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(...options.outputCells));
        txSkeleton = txSkeleton.update("inputs", (inputs) => inputs.push(...collected));
        txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
            cellDeps.push(...[
                {
                    out_point: {
                        tx_hash:SECP256K1_BLAKE160_HASH,
                        index: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
                    },
                    dep_type: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
                }
            ])
        );
        txSkeleton = txSkeleton.update("cellDeps",(cellDeps)=> cellDeps.push(...options.deps));

        const firstIndex = txSkeleton
            .get("inputs")
            .findIndex((input) =>
                new ScriptValue(input.cell_output.lock, { validate: false }).equals(
                    new ScriptValue(fromScript, { validate: false })
                )
            );
        if (firstIndex !== -1) {
            while (firstIndex >= txSkeleton.get("witnesses").size) {
                txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
            }
            let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
            const newWitnessArgs: WitnessArgs = {
                /* 65-byte zeros in hex */
                lock:
                    "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            };
            if (witness !== "0x") {
                const witnessArgs = new core.WitnessArgs(new toolkit.Reader(witness));
                const lock = witnessArgs.getLock();
                if (lock.hasValue() && new toolkit.Reader(lock.value().raw()).serializeJson() !== newWitnessArgs.lock) {
                    throw new Error("Lock field in first witness is set aside for signature!");
                }
                const inputType = witnessArgs.getInputType();
                if (inputType.hasValue()) {
                    newWitnessArgs.input_type = new toolkit.Reader(inputType.value().raw()).serializeJson();
                }
                const outputType = witnessArgs.getOutputType();
                if (outputType.hasValue()) {
                    newWitnessArgs.output_type = new toolkit.Reader(outputType.value().raw()).serializeJson();
                }
            }
            witness = new toolkit.Reader(
                core.SerializeWitnessArgs(toolkit.normalizers.NormalizeWitnessArgs(newWitnessArgs))
            ).serializeJson();
            txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex, witness));
        }


        txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
        const message = txSkeleton.get("signingEntries").get(0)?.message;
        const Sig = hd.key.signRecoverable(message!, options.privKey);
        const tx = helpers.sealTransaction(txSkeleton, [Sig]);

        if( options.lightMode == true){
            if(options.lightNotInstallCellMode == null||options.lightNotInstallCellMode == false){
                await installTxCells(tx)
            }
            const hash = await sendTransaction(tx,CKB_LIGHT_RPC_URL)
            console.log("The CKB_LIGHT_RPC_URL transaction hash is", hash);
            return hash;
        }
        const hash = await this.defaultRpc.send_transaction(tx, "passthrough");
        console.log("The transaction hash is", hash);
        return hash;
    }
}
type Account = {
    lockScript: Script;
    address: Address;
    pubKey: string;
};
export const generateAccountFromPrivateKey = (privKey: string): Account => {
    const pubKey = hd.key.privateToPublic(privKey);
    const args = hd.key.publicKeyToBlake160(pubKey);
    const template = AGGRON4.SCRIPTS.SECP256K1_BLAKE160!;
    const lockScript = {
        code_hash: template.CODE_HASH,
        hash_type: template.HASH_TYPE,
        args: args,
    };
    const address = helpers.generateAddress(lockScript, { config: AGGRON4 });
    return {
        lockScript,
        address,
        pubKey,
    };
};

export async function capacityOf(address: string): Promise<BI> {
    const collector = defaultIndexer.collector({
        lock: helpers.parseAddress(address, { config: AGGRON4 }),
    });

    let balance = BI.from(0);
    for await (const cell of collector.collect()) {
        balance = balance.add(cell.cell_output.capacity);
    }

    return balance;
}

interface transferOptions {
    from: string;
    to: string;
    amount: string;
    privKey: string;
}
interface Options {
    from: string;
    outputCells: Cell[];
    privKey: string;
    inputCells?: Cell[];
    deps?:CellDep[];
    lightMode?:boolean;
    lightNotInstallCellMode?:boolean;
}

function getOutPutCell(to:string,amount: string,data:string):Cell{

    const toScript = helpers.parseAddress(to, { config: AGGRON4 });
    return {
        cell_output: {
            capacity: BI.from(amount).mul(100000000).toHexString(),
            lock: toScript,
        },
        data: "0x",
    };
}


export async function transfer(options: transferOptions): Promise<string> {

    const transferOutput: Cell = getOutPutCell(options.to,options.amount,"0x");
    return send_tx({
        from:options.from,
        outputCells:[transferOutput],
        privKey:options.privKey,
    });
}

export async function send_tx_with_input(options:Options):Promise<string>{
    let txSkeleton = helpers.TransactionSkeleton({});

    const fromScript = helpers.parseAddress(options.from, { config: AGGRON4 });


    txSkeleton = txSkeleton.update("inputs", (inputs) => inputs.push(...options.inputCells));
    txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(...options.outputCells));
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>

        cellDeps.push(...[
            {
                out_point: {
                    tx_hash: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
                    index: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
                },
                dep_type: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
            },{
                out_point: {
                    tx_hash: AGGRON4.SCRIPTS.SUDT.TX_HASH,
                    index: AGGRON4.SCRIPTS.SUDT.INDEX,
                },
                dep_type: AGGRON4.SCRIPTS.SUDT.DEP_TYPE,
            },
            {
                out_point: {
                    tx_hash: EVERY_ONE_CAN_PAY.TX_HASH,
                    index: EVERY_ONE_CAN_PAY.INDEX,
                },
                dep_type:  AGGRON4.SCRIPTS.SUDT.DEP_TYPE,
            }

        ])

    );

    const firstIndex = txSkeleton
        .get("inputs")
        .findIndex((input) =>
            new ScriptValue(input.cell_output.lock, { validate: false }).equals(
                new ScriptValue(fromScript, { validate: false })
            )
        );
    if (firstIndex !== -1) {
        while (firstIndex >= txSkeleton.get("witnesses").size) {
            txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
        }
        let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
        const newWitnessArgs: WitnessArgs = {
            /* 65-byte zeros in hex */
            lock:
                "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        };
        if (witness !== "0x") {
            const witnessArgs = new core.WitnessArgs(new toolkit.Reader(witness));
            const lock = witnessArgs.getLock();
            if (lock.hasValue() && new toolkit.Reader(lock.value().raw()).serializeJson() !== newWitnessArgs.lock) {
                throw new Error("Lock field in first witness is set aside for signature!");
            }
            const inputType = witnessArgs.getInputType();
            if (inputType.hasValue()) {
                newWitnessArgs.input_type = new toolkit.Reader(inputType.value().raw()).serializeJson();
            }
            const outputType = witnessArgs.getOutputType();
            if (outputType.hasValue()) {
                newWitnessArgs.output_type = new toolkit.Reader(outputType.value().raw()).serializeJson();
            }
        }
        witness = new toolkit.Reader(
            core.SerializeWitnessArgs(toolkit.normalizers.NormalizeWitnessArgs(newWitnessArgs))
        ).serializeJson();
        txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex, witness));
    }

    txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)?.message;
    const Sig = hd.key.signRecoverable(message!, options.privKey);
    const tx = helpers.sealTransaction(txSkeleton, [Sig]);
    const hash = await defaultRpc.send_transaction(tx, "passthrough");
    console.log("The transaction hash is", hash);

    return hash;
}


export async function send_tx_options(options:Options):Promise<string>{
    let txSkeleton = helpers.TransactionSkeleton({});
    const fromScript = helpers.parseAddress(options.from, { config: AGGRON4 });


    const neededCap = options.outputCells.reduce((total, cell) => {
        return total.add(BI.from(cell.cell_output.capacity))
    }, BI.from(0))
    const inputCap = options.inputCells.reduce((total, cell) => {
        return total.add(BI.from(cell.cell_output.capacity))
    }, BI.from(0))

    if (inputCap.lt( neededCap.toNumber())) {
        throw new Error("Not enough CKB"+"input:"+inputCap.toNumber()+",output:"+neededCap.toNumber());
    }

    if(inputCap.sub(neededCap).sub(FeeRate.NORMAL).gt(BI.from('0'))) {
        const changeOutput: Cell = {
            cell_output: {
                capacity: inputCap.sub(neededCap).sub(FeeRate.NORMAL).toHexString(),
                lock: fromScript,
            },
            data: "0x",
        };
        console.log('gen out put extra value ')
        txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(changeOutput));
    }

    txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(...options.outputCells));
    txSkeleton = txSkeleton.update("inputs", (inputs) => inputs.push(...options.inputCells));
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push(...[
            {
                out_point: {
                    tx_hash: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
                    index: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
                },
                dep_type: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
            },{
                out_point: {
                    tx_hash: AGGRON4.SCRIPTS.SUDT.TX_HASH,
                    index: AGGRON4.SCRIPTS.SUDT.INDEX,
                },
                dep_type: AGGRON4.SCRIPTS.SUDT.DEP_TYPE,
            },
            {
                out_point: {
                    tx_hash: EVERY_ONE_CAN_PAY_TYPE_ID.TX_HASH,
                    index: EVERY_ONE_CAN_PAY_TYPE_ID.INDEX,
                },
                dep_type:  AGGRON4.SCRIPTS.SUDT.DEP_TYPE,
            }
        ])
    );
    txSkeleton = txSkeleton.update("cellDeps",(cellDeps)=> cellDeps.push(...options.deps));

    const firstIndex = txSkeleton
        .get("inputs")
        .findIndex((input) =>
            new ScriptValue(input.cell_output.lock, { validate: false }).equals(
                new ScriptValue(fromScript, { validate: false })
            )
        );
    if (firstIndex !== -1) {
        while (firstIndex >= txSkeleton.get("witnesses").size) {
            txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
        }
        let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
        const newWitnessArgs: WitnessArgs = {
            /* 65-byte zeros in hex */
            lock:
                "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        };
        if (witness !== "0x") {
            const witnessArgs = new core.WitnessArgs(new toolkit.Reader(witness));
            const lock = witnessArgs.getLock();
            if (lock.hasValue() && new toolkit.Reader(lock.value().raw()).serializeJson() !== newWitnessArgs.lock) {
                throw new Error("Lock field in first witness is set aside for signature!");
            }
            const inputType = witnessArgs.getInputType();
            if (inputType.hasValue()) {
                newWitnessArgs.input_type = new toolkit.Reader(inputType.value().raw()).serializeJson();
            }
            const outputType = witnessArgs.getOutputType();
            if (outputType.hasValue()) {
                newWitnessArgs.output_type = new toolkit.Reader(outputType.value().raw()).serializeJson();
            }
        }
        witness = new toolkit.Reader(
            core.SerializeWitnessArgs(toolkit.normalizers.NormalizeWitnessArgs(newWitnessArgs))
        ).serializeJson();
        txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex, witness));
    }


    txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)?.message;
    const Sig = hd.key.signRecoverable(message!, options.privKey);
    const tx = helpers.sealTransaction(txSkeleton, [Sig]);
    const hash = await defaultRpc.send_transaction(tx, "passthrough");
    console.log("The transaction hash is", hash);

    return hash;

}

export async function send_tx(options: Options): Promise<string> {
    let txSkeleton = helpers.TransactionSkeleton({});
    const fromScript = helpers.parseAddress(options.from, { config: AGGRON4 });

    let neededCapacity = BI.from(0)
    for (let i = 0; i < options.outputCells.length; i++) {
        neededCapacity = neededCapacity.add(options.outputCells[i].cell_output.capacity)
    }
    let collectedSum = BI.from(0);
    const collected: Cell[] = [];
    const collector = defaultIndexer.collector({ lock: fromScript, type: "empty" });
    for await (const cell of collector.collect()) {
        collectedSum = collectedSum.add(cell.cell_output.capacity);
        collected.push(cell);
        if (collectedSum >= neededCapacity) break;
    }
    console.log('total cell balance: ',collectedSum.toString())

    if (collectedSum < neededCapacity) {
        throw new Error("Not enough CKB");
    }

    if(collectedSum.sub(neededCapacity).sub(FeeRate.NORMAL).gt(BI.from('0'))) {
        const changeOutput: Cell = {
            cell_output: {
                capacity: collectedSum.sub(neededCapacity).sub(FeeRate.NORMAL).toHexString(),
                lock: fromScript,
            },
            data: "0x",
        };
        console.log('gen out put extra value ')
        if(collectedSum.sub(neededCapacity).sub(FeeRate.NORMAL).gt(6100000000)){
            //expected occupied capacity (0x16b969d00)
            txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(changeOutput));
        }else {
            options.outputCells[0].cell_output.capacity = collectedSum.sub(neededCapacity).sub(FeeRate.NORMAL).add(options.outputCells[0].cell_output.capacity).toHexString()
        }
    }

    let SECP256K1_BLAKE160_HASH = (await defaultRpc.get_block_by_number("0x0")).transactions[1].hash

    txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(...options.outputCells));
    txSkeleton = txSkeleton.update("inputs", (inputs) => inputs.push(...collected));
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push(...[
            {
            out_point: {
                tx_hash:SECP256K1_BLAKE160_HASH,
                index: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
            },
            dep_type: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
        }
        ])
    );
    txSkeleton = txSkeleton.update("cellDeps",(cellDeps)=> cellDeps.push(...options.deps));

    const firstIndex = txSkeleton
        .get("inputs")
        .findIndex((input) =>
            new ScriptValue(input.cell_output.lock, { validate: false }).equals(
                new ScriptValue(fromScript, { validate: false })
            )
        );
    if (firstIndex !== -1) {
        while (firstIndex >= txSkeleton.get("witnesses").size) {
            txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
        }
        let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
        const newWitnessArgs: WitnessArgs = {
            /* 65-byte zeros in hex */
            lock:
                "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        };
        if (witness !== "0x") {
            const witnessArgs = new core.WitnessArgs(new toolkit.Reader(witness));
            const lock = witnessArgs.getLock();
            if (lock.hasValue() && new toolkit.Reader(lock.value().raw()).serializeJson() !== newWitnessArgs.lock) {
                throw new Error("Lock field in first witness is set aside for signature!");
            }
            const inputType = witnessArgs.getInputType();
            if (inputType.hasValue()) {
                newWitnessArgs.input_type = new toolkit.Reader(inputType.value().raw()).serializeJson();
            }
            const outputType = witnessArgs.getOutputType();
            if (outputType.hasValue()) {
                newWitnessArgs.output_type = new toolkit.Reader(outputType.value().raw()).serializeJson();
            }
        }
        witness = new toolkit.Reader(
            core.SerializeWitnessArgs(toolkit.normalizers.NormalizeWitnessArgs(newWitnessArgs))
        ).serializeJson();
        txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex, witness));
    }


    txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)?.message;
    const Sig = hd.key.signRecoverable(message!, options.privKey);
    const tx = helpers.sealTransaction(txSkeleton, [Sig]);

    if( options.lightMode == true){
        if(options.lightNotInstallCellMode == null||options.lightNotInstallCellMode == false){
            await installTxCells(tx)
        }
        console.log("send tx:",tx)
        const hash = await sendTransaction(tx,CKB_LIGHT_RPC_URL)
        console.log("The CKB_LIGHT_RPC_URL transaction hash is", hash);
        return hash;
    }
    const hash = await defaultRpc.send_transaction(tx, "passthrough");
    console.log("The transaction hash is", hash);

    return hash;

}


async function installTxCells(tx:Transaction) {

    // install dep hash
    for (let i = 0; i < tx.cell_deps.length; i++) {
        let dep = tx.cell_deps[i].out_point
        await fetchTransactionUntilFetched(dep.tx_hash,CKB_LIGHT_RPC_URL,100)
    }
    // install cell
    let scrips:ScriptMsg[] = []
    let minBlockNum = BI.from("0xffffffffffff")
    let heightBlockNum = BI.from("0x0")

    for (let i = 0; i < tx.inputs.length; i++) {

        // get input scripts

        scrips.push({
            script:await getScriptByOutPut(tx.inputs[i].previous_output),
            script_type:"lock",
            block_number:"0x1"
        })
        // get min block num
        let blockNum = await getBlockNumByTxHash(tx.inputs[i].previous_output.tx_hash)
        if(minBlockNum.gt(blockNum)){
            minBlockNum = blockNum
        }
        // get height block num
        if(heightBlockNum.lt(blockNum)){
            heightBlockNum = blockNum
        }
    }
    for (let i = 0; i <scrips.length ; i++) {
        scrips[i].block_number = minBlockNum.sub(1).toHexString()
    }
    await setScripts(scrips)
    await waitScriptsUpdate(heightBlockNum,CKB_LIGHT_RPC_URL)

}

//Error: transaction.outputs[1].capacity must be a hex integer!
async function getScriptByOutPut(previous_output: OutPoint):Promise<Script> {
    let cell = await rpcCLient.get_live_cell(previous_output,false)
    console.log('cell:',cell)
    if (cell.status == 'unknown'){
        throw Error("cell is died")
    }
    return cell.cell.output.lock;
}

export async function getBlockNumByTxHash(tx_hash: string):Promise<BI> {
    let txInfo = await rpcCLient.get_transaction(tx_hash)
    if (txInfo.tx_status.block_hash == null){
        throw Error("block_hash is null,txHash:"+tx_hash)
    }
    let blockInfo = await rpcCLient.get_block(txInfo.tx_status.block_hash)
    return BI.from(blockInfo.header.number)
}
