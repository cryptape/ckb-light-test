import {generateAccountFromPrivateKey} from "../../service/transfer";
import {
    ACCOUNT_PRIVATE,
    ACCOUNT_PRIVATE2, CKB_DEV_RPC_URL,
    CKB_LIGHT_RPC_URL, CKB_RPC_URL,
    lightClientRPC,
    rpcDevCLient,
    rpcDevIndexClient
} from "../../config/config";
import {
    cleanAllEnv,
    cleanAndRestartCkbLightClientEnv,
    miner_block, miner_block_until_number,
    startEnv,
    transferDevService
} from "../../service/CkbDevService";
import {Sleep} from "../../service/util";
import {checkScriptsInLightClient, waitScriptsUpdate} from "../../service/lightService";
import {BI} from "@ckb-lumos/bi";
import {expect} from "chai";
import {common, dao, deploy, MultisigScript, parseFromInfo} from "@ckb-lumos/common-scripts";
import {AddressType, ExtendedPrivateKey, key, mnemonic} from "@ckb-lumos/hd";

import {
    TransactionSkeleton,
    parseAddress,
    sealTransaction,
    encodeToAddress, TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import {config, RPC} from "@ckb-lumos/lumos";
import {generate_epochs, send_transaction} from "../../service/ckbService";
import {HexString, OutPoint, Cell} from "@ckb-lumos/base";
import {Transaction} from "@ckb-lumos/base/lib/api";

describe('DaoScriptSizeVerifier', function () {
    // A Nervos DAO deposit cell must have input data
    // A Nervos DAO deposit cell must have input data
    // Only input data with full zeros are counted as deposit cell

    // Only cells committed after the pre-defined block number in consensus is
    // applied to this rule

    // Now we have a pair of DAO deposit and withdrawing cells, it is expected
    // they have the lock scripts of the same size.

    this.timeout(10000000)
    let miner = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)
    let acc2 = generateAccountFromPrivateKey(ACCOUNT_PRIVATE2);

    async function initLightClient() {
        if (!(await checkScriptsInLightClient([miner.lockScript, acc2.lockScript]))) {
            await lightClientRPC.setScripts([
                {
                    script: miner.lockScript,
                    scriptType: "lock",
                    blockNumber: "0x0"
                },
                {
                    script: acc2.lockScript,
                    scriptType: "lock",
                    blockNumber: "0x0"
                }
            ])
        }

        let tip_num = await rpcDevCLient.getTipBlockNumber()
        await waitScriptsUpdate(BI.from(tip_num))
    }

    before(async () => {
        await cleanAllEnv();
        await startEnv();
        await Sleep(3000);
        await initLightClient();
        await initConfig(rpcDevCLient)
    })

    it("DaoLockSizeMismatch", async () => {
        await miner_block()
        let tip_num = await rpcDevCLient.getTipBlockNumber()
        await waitScriptsUpdate(BI.from(tip_num))
        let txSkeleton = TransactionSkeleton({cellProvider: rpcDevIndexClient});

        txSkeleton = await dao.deposit(
            txSkeleton,
            getAddressByPrivateKey(ACCOUNT_PRIVATE),
            getAddressByPrivateKey(ACCOUNT_PRIVATE),
            BI.from(200 * 100000000)
        );

        txSkeleton = await common.payFeeByFeeRate(txSkeleton, [getAddressByPrivateKey(ACCOUNT_PRIVATE)], 1000);
        txSkeleton = common.prepareSigningEntries(txSkeleton);
        const message = txSkeleton.get("signingEntries").get(0)?.message;
        const Sig = key.signRecoverable(message!, ACCOUNT_PRIVATE);
        const tx = sealTransaction(txSkeleton, [Sig]);
        tip_num = await rpcDevCLient.getTipBlockNumber()
        await waitScriptsUpdate(BI.from(tip_num))
        let depositTx = await send_transaction(tx, CKB_LIGHT_RPC_URL)
        await Sleep(1000)
        await miner_block();
        await Sleep(1000)
        await miner_block();

        let txWithStatus = await rpcDevCLient.getTransaction(depositTx)
        expect(txWithStatus.txStatus.status).to.equal("committed");

        console.log("withdraw")
        const depositOutpoint = {txHash: depositTx, index: "0x0"}
        console.log('depositOutpoint: ', depositOutpoint)
        // const withdrawTx = await daoWithdraw(ACCOUNT_PRIVATE, depositOutpoint,
        //     // getAddressByPrivateKey(ACCOUNT_PRIVATE)
        //     encodeToAddress({
        //         args: "0x12",
        //         codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        //         hashType: 'type'
        //     })
        // );

        const depositCell = await getCellByOutPoint(depositOutpoint);
        let withdrawTxSkeleton = TransactionSkeleton({cellProvider: rpcDevIndexClient});

        withdrawTxSkeleton = await dao.withdraw(
            withdrawTxSkeleton,
            depositCell,
            getAddressByPrivateKey(ACCOUNT_PRIVATE)
        );

        txSkeleton = await common.payFeeByFeeRate(withdrawTxSkeleton, [getAddressByPrivateKey(ACCOUNT_PRIVATE)], 1000);
        let cell = txSkeleton.outputs.get(0)
        cell.cellOutput.lock = {
            args: "0x12",
            codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hashType: 'type'
        }
        withdrawTxSkeleton.outputs.set(0, cell)

        withdrawTxSkeleton = common.prepareSigningEntries(txSkeleton);
        let message1 = withdrawTxSkeleton.get("signingEntries").get(0)?.message;
        let Sig1 = key.signRecoverable(message1!, ACCOUNT_PRIVATE);
        let withdrawTx = sealTransaction(withdrawTxSkeleton, [Sig1]);

        console.log("withdrawTx:", JSON.stringify(withdrawTx))
        // await rpcDevCLient.sendTransaction(withdrawTx, "passthrough")
        try {
            await send_transaction(withdrawTx, CKB_LIGHT_RPC_URL)
            expect.fail("should throw error")
        } catch (e) {
            console.log("expect error:", e);
            expect(e.message).to.include("The lock script size of deposit cell at index 0 does not match the withdrawing cell at the same index");
        }

        // header not exist
        withdrawTxSkeleton = TransactionSkeleton({cellProvider: rpcDevIndexClient});

        withdrawTxSkeleton = await dao.withdraw(
            withdrawTxSkeleton,
            depositCell,
            getAddressByPrivateKey(ACCOUNT_PRIVATE)
        );
        withdrawTxSkeleton.headerDeps.set(0, "0x42ba223252967c0de970d82c4574c05fc4b6a6087e6575e353adb974573e4312")

        txSkeleton = await common.payFeeByFeeRate(withdrawTxSkeleton, [getAddressByPrivateKey(ACCOUNT_PRIVATE)], 1000);


        withdrawTxSkeleton = common.prepareSigningEntries(txSkeleton);
        message1 = withdrawTxSkeleton.get("signingEntries").get(0)?.message;
        Sig1 = key.signRecoverable(message1!, ACCOUNT_PRIVATE);
        withdrawTx = sealTransaction(withdrawTxSkeleton, [Sig1]);

        console.log("header err withdrawTx:", JSON.stringify(withdrawTx))
        try {
            await send_transaction(withdrawTx, CKB_LIGHT_RPC_URL)
        } catch (e) {
            console.log("header err expect error:", e);
        }
        // normal tx
        withdrawTxSkeleton = TransactionSkeleton({cellProvider: rpcDevIndexClient});

        withdrawTxSkeleton = await dao.withdraw(
            withdrawTxSkeleton,
            depositCell,
            getAddressByPrivateKey(ACCOUNT_PRIVATE)
        );

        withdrawTxSkeleton = await common.payFeeByFeeRate(withdrawTxSkeleton, [getAddressByPrivateKey(ACCOUNT_PRIVATE)], 1000);


        withdrawTxSkeleton = common.prepareSigningEntries(withdrawTxSkeleton);
        message1 = withdrawTxSkeleton.get("signingEntries").get(0)?.message;
        Sig1 = key.signRecoverable(message1!, ACCOUNT_PRIVATE);
        withdrawTx = sealTransaction(withdrawTxSkeleton, [Sig1]);

        console.log("withdrawTx:", JSON.stringify(withdrawTx))
        await Sleep(10 * 1000)
        let tipHeader = await lightClientRPC.getTipHeader()
        console.log('tip header:', tipHeader.number)
        tip_num = await rpcDevCLient.getTipBlockNumber()
        await waitScriptsUpdate(BI.from(tip_num))
        let withdrawTxHash = await send_transaction(withdrawTx, CKB_LIGHT_RPC_URL)
        await Sleep(1000)
        await miner_block()
        await Sleep(1000)
        await miner_block();
        let txWithStatus2 = await rpcDevCLient.getTransaction(withdrawTxHash)
        expect(txWithStatus2.txStatus.status).to.equal("committed");
        console.log("withdraw success")

        // unlock
        txSkeleton = TransactionSkeleton({cellProvider: rpcDevIndexClient});
        let withdrawOutpoint = {txHash: withdrawTxHash, index: "0x0"}
        let withdrawCell = await getCellByOutPoint(withdrawOutpoint)
        txSkeleton = await dao.unlock(
            txSkeleton,
            depositCell,
            withdrawCell,
            getAddressByPrivateKey(ACCOUNT_PRIVATE),
            ACCOUNT_PRIVATE
        );

        txSkeleton = await common.payFeeByFeeRate(txSkeleton, [getAddressByPrivateKey(ACCOUNT_PRIVATE)], 1000);

        txSkeleton = common.prepareSigningEntries(txSkeleton);
        let message2 = txSkeleton.get("signingEntries").get(0)?.message;
        let Sig2 = key.signRecoverable(message2!, ACCOUNT_PRIVATE);
        let tx2 = sealTransaction(txSkeleton, [Sig2]);

        tip_num = await rpcDevCLient.getTipBlockNumber()
        await waitScriptsUpdate(BI.from(tip_num))
        try {
            await send_transaction(tx2, CKB_LIGHT_RPC_URL);
            expect.fail("should the transaction is immature because of the since requirement")
        } catch (e) {
            e.toString().concat("the transaction is immature because of the since requirement")
        }
        await generate_epochs("0xb4", CKB_DEV_RPC_URL)
        tip_num = await rpcDevCLient.getTipBlockNumber()
        await waitScriptsUpdate(BI.from(tip_num))
        await send_transaction(tx2, CKB_LIGHT_RPC_URL);
    })

});

function getAddressByPrivateKey(_privKey: string): string {
    const pubKey = key.privateToPublic(_privKey);
    const args = key.publicKeyToBlake160(pubKey);

    return encodeToAddress({
        args: args, codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8", hashType: 'type'

    });
}

async function daoWithdraw(fromPk: HexString, depositOutpoint: OutPoint, toAddress: string): Promise<Transaction> {

    const depositCell = await getCellByOutPoint(depositOutpoint);
    let txSkeleton = TransactionSkeleton({cellProvider: rpcDevIndexClient});

    txSkeleton = await dao.withdraw(
        txSkeleton,
        depositCell,
        toAddress
    );

    txSkeleton = await common.payFeeByFeeRate(txSkeleton, [getAddressByPrivateKey(fromPk)], 1000);

    txSkeleton = common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)?.message;
    const Sig = key.signRecoverable(message!, fromPk);
    return sealTransaction(txSkeleton, [Sig]);
}

async function getCellByOutPoint(outpoint: OutPoint): Promise<Cell> {
    const tx = await rpcDevCLient.getTransaction(outpoint.txHash)
    console.log("[debug]:", tx)
    if (!tx) {
        throw new Error(`not found tx: ${outpoint.txHash}`)
    }
    console.log("[debug]:", tx.txStatus.blockHash!)
    const block = await rpcDevCLient.getBlock(tx.txStatus.blockHash!)

    return {
        cellOutput: tx.transaction.outputs[0],
        data: tx.transaction.outputsData[0],
        outPoint: outpoint,
        blockHash: tx.txStatus.blockHash,
        blockNumber: block!.header.number,
    }
}


async function initConfig(rpc: RPC) {
    let block = await rpc.getBlockByNumber("0x0")
    console.log(block.transactions[0].hash)
    console.log(block.transactions[1].hash)
    let SECP256K1_BLAKE160_HASH = block.transactions[1].hash
    let DAO_HASH = block.transactions[0].hash
    config.initializeConfig(
        config.createConfig({
            PREFIX: "ckt",
            SCRIPTS: {
                SECP256K1_BLAKE160: {
                    CODE_HASH:
                        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                    HASH_TYPE: "type",
                    TX_HASH: SECP256K1_BLAKE160_HASH,
                    INDEX: "0x0",
                    DEP_TYPE: "depGroup",
                    SHORT_ID: 0,
                },
                SECP256K1_BLAKE160_MULTISIG: {
                    CODE_HASH:
                        "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
                    HASH_TYPE: "type",
                    TX_HASH: SECP256K1_BLAKE160_HASH,
                    INDEX: "0x1",
                    DEP_TYPE: "depGroup",
                    SHORT_ID: 1,
                },
                DAO: {
                    CODE_HASH:
                        "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
                    HASH_TYPE: "type",
                    TX_HASH:
                    DAO_HASH,
                    INDEX: "0x2",
                    DEP_TYPE: "code",
                },
                SUDT: {
                    CODE_HASH:
                        "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
                    HASH_TYPE: "type",
                    TX_HASH:
                        "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769",
                    INDEX: "0x0",
                    DEP_TYPE: "code",
                },
                ANYONE_CAN_PAY: {
                    CODE_HASH:
                        "0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356",
                    HASH_TYPE: "type",
                    TX_HASH:
                        "0xec26b0f85ed839ece5f11c4c4e837ec359f5adc4420410f6453b1f6b60fb96a6",
                    INDEX: "0x0",
                    DEP_TYPE: "depGroup",
                    SHORT_ID: 2,
                },
                OMNILOCK: {
                    CODE_HASH:
                        "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
                    HASH_TYPE: "type",
                    TX_HASH:
                        "0x27b62d8be8ed80b9f56ee0fe41355becdb6f6a40aeba82d3900434f43b1c8b60",
                    INDEX: "0x0",
                    DEP_TYPE: "code",
                },
            },
        })
    )
    console.log("init :", block.transactions[0].hash)
}