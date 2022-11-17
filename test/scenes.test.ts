import {
    ACCOUNT_PRIVATE,
    CKB_LIGHT_RPC_URL,
    CKB_RPC_INDEX_URL,
    CKB_RPC_URL,
    CkbClientNode, MINER_SCRIPT3,
    rpcCLient
} from "../config/config";
import {
    getCells, getCellsCapacity, getCellsRequest, getHeader,
    getScripts,
    getTipHeader,
    getTransaction, getTransactions, ScriptObject,
    sendTransaction,
    setScripts, waitScriptsUpdate
} from "../rpc";
import {expect} from "chai";
import {BI, RPC} from "@ckb-lumos/lumos";
import {Output} from "@ckb-lumos/base/lib/api";
import {AGGRON4, generateAccountFromPrivateKey, getBlockNumByTxHash, send_tx} from "../service/transfer";
import {issueTokenCell} from "../service/sudt";
import {Sleep} from "../service/util";

describe('scenes', function () {
    this.timeout(600_000)
    describe('clean data ', function () {

        before(async () => {

            await CkbClientNode.clean()
            await CkbClientNode.start()
            await CkbClientNode.status()

        })
        describe('get_scripts', function () {

            it('should return []', async () => {
                let response = await getScripts()
                expect(response.toString()).to.be.equal('')
            })

        });
        describe('get_tip_header', function () {
            it('should return not null', async () => {

                let response = await getTipHeader()
                expect(response).to.be.not.equal(null)

            })
        });
        describe('get_transaction', function () {

            it('not exit tx ,should return null', async () => {
                let response = await getTransaction("0x5be494190c1173bc7058dfeb9aa2420ac0a91df5634321298079e7f3765011f9")
                console.log('response:', response)
                expect(response).to.be.equal(null)
            })

            it('0 tx,should return hash', async () => {
                let txs = await getTransactionsByBlockNum(0, rpcCLient)
                let txResponses = txs.map(async (tx) => {
                    return await getTransaction(tx)
                })
                for (let i = 0; i < txResponses.length; i++) {
                    let response = await txResponses[i]
                    expect(response.header.number).to.be.equal("0x0")
                }
            })

            it('exist tx ,buy not contains cell tx ,should return null', async () => {
                let header = await getTipHeader()
                let txs = await getTransactionsByBlockNum(header.number, rpcCLient)
                for (const tx of txs) {
                    let response = await getTransaction(tx)
                    expect(response).to.be.equal(null)
                }
            })
        });
        describe('send_transaction', function () {
            it('dep in block:0,cell in block:0,should return success ', async () => {
                let tx = await sendTransaction({
                    "cell_deps": [{
                        "dep_type": "dep_group",
                        "out_point": {
                            "index": "0x0",
                            "tx_hash": "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37"
                        }
                    }],
                    "header_deps": [],
                    "inputs": [{
                        "previous_output": {
                            "index": "0x7",
                            "tx_hash": "0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f"
                        }, "since": "0x0"
                    }],
                    "outputs": [{
                        "capacity": "0x470de4df820000",
                        "lock": {
                            "args": "0xff5094c2c5f476fc38510018609a3fd921dd28ad",
                            "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                            "hash_type": "type"
                        },
                        "type": null
                    }, {
                        "capacity": "0xb61134e5a35e800",
                        "lock": {
                            "args": "0x64257f00b6b63e987609fa9be2d0c86d351020fb",
                            "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                            "hash_type": "type"
                        },
                        "type": null
                    }],
                    "outputs_data": ["0x", "0x"],
                    "version": "0x0",
                    "witnesses": ["0x5500000010000000550000005500000041000000af34b54bebf8c5971da6a880f2df5a186c3f8d0b5c9a1fe1a90c95b8a4fb89ef3bab1ccec13797dcb3fee80400f953227dd7741227e08032e3598e16ccdaa49c00"]
                }, CKB_LIGHT_RPC_URL)
                console.log('tx:', tx)
            })

            it('dep cell is  not in  fetched and setScript ,return failed', async () => {

                let acc = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)
                let cell = issueTokenCell(acc.address, 10000)
                try {
                    await send_tx({
                        from: acc.address,
                        outputCells: [cell],
                        privKey: ACCOUNT_PRIVATE,
                        lightMode: true,
                        lightNotInstallCellMode: true
                    })
                } catch (e) {
                    console.log(e)
                    return
                }
                expect("").to.be.equal("failed")

            })

            it('dep in install tx,return success', async () => {

                let acc = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)
                let cell = issueTokenCell(acc.address, 10000)
                let tx = await send_tx({
                    from: acc.address,
                    outputCells: [cell],
                    privKey: ACCOUNT_PRIVATE,
                    lightMode: true,
                    deps: [
                        {
                            out_point: {
                                tx_hash: AGGRON4.SCRIPTS.SUDT.TX_HASH,
                                index: AGGRON4.SCRIPTS.SUDT.INDEX,
                            },
                            dep_type: AGGRON4.SCRIPTS.SUDT.DEP_TYPE,
                        }
                    ]
                })
                console.log('tx:', tx)
            })

        });

    });
    describe('set script that block begin with 0', function () {

        let account = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)

        const costTx = "0x1850f997f867b6d3f1154444498a15e9fc4ce080215e34d0c41b33349bcc119a"
        before(async () => {
            await setScripts([
                // {
                // script: account.lockScript,
                // block_number: "0x0"
                // },
                // miner_script3
                // cost block num:16095
                // cost tx: https://pudge.explorer.nervos.org/transaction/0x1850f997f867b6d3f1154444498a15e9fc4ce080215e34d0c41b33349bcc119a
                {
                    script: MINER_SCRIPT3,
                    script_type: "lock",
                    block_number: "0x0"

                    // block_number:"0x3e8"
                }])
            await waitScriptsUpdate(BI.from(16096))

        })
        describe('get_scripts', function () {
            it('query 2 times, block num should inc ', async () => {
                let response1 = await getScripts()
                await Sleep(30 * 1000)
                let response2 = await getScripts()
                expect(response1[0].block_number).to.be.not.equal(response2[0].block_number)
            });

        });
        describe('get_transaction', function () {

            it.skip('query hash\'s block num < get_script\'s number,and hash \'s out_put is used,should return not null', async () => {
                // miner_script3
                // cost block num:16095
                // cost tx: https://pudge.explorer.nervos.org/transaction/0x1850f997f867b6d3f1154444498a15e9fc4ce080215e34d0c41b33349bcc119a

                await waitScriptsUpdate(BI.from("16095"), CKB_LIGHT_RPC_URL)
                let tx = await getTransaction("0x1850f997f867b6d3f1154444498a15e9fc4ce080215e34d0c41b33349bcc119a", CKB_RPC_URL)
                let failedTx = []

                // query cost cell
                for (let i = 0; i < tx.transaction.inputs.length; i++) {
                    let output = tx.transaction.inputs[i]
                    let response = await getTransaction(output.previous_output.tx_hash)
                    try {
                        expect(response.transaction.hash).to.be.equal(output.previous_output.tx_hash)
                    } catch (e) {
                        failedTx.push({
                            blockNum: (await getBlockNumByTxHash(output.previous_output.tx_hash)).toNumber(),
                            txHash: output.previous_output.tx_hash,
                            error: e.toString()
                        })
                    }
                }
                for (let i = 0; i < failedTx.length; i++) {
                    console.log('found cost cell tx hash failed :', failedTx[i])
                }
                expect(failedTx.length).to.be.equal(0)
            });

            it('query uncollected hashes,should return null', async () => {
                let cellsIndex = await getCellsRequest({
                    limit: "0x10",
                    order: "desc",
                    search_key: {
                        script: MINER_SCRIPT3,
                        script_type: "lock",
                    }
                }, CKB_RPC_INDEX_URL)
                // get current sync high
                let getScriptsResult = await getScripts()
                let currentUpdateBlockNum = BI.from(getScriptsResult[0].block_number)

                for (let i = 0; i < cellsIndex.objects.length; i++) {
                    if (currentUpdateBlockNum.gt(cellsIndex.objects[i].block_number)) {
                        continue
                    }
                    let result = await getTransaction(cellsIndex.objects[i].out_point.tx_hash)
                    expect(result).to.be.equal(null)
                }

            })
        })

        describe('get_header', function () {
            it.skip('query cost hash', async () => {
                let txInfo = await rpcCLient.get_transaction(costTx)
                let txs = txInfo.transaction.inputs
                    .map(input => input.previous_output.tx_hash)
                let headerNullRes = []
                for (let i = 0; i < txs.length; i++) {
                    let tx = txs[i]
                    let txInfo = await getTransaction(tx, CKB_RPC_URL)
                    console.log('txInfo:', txInfo)
                    let header = await getHeader(txInfo.tx_status.block_hash)

                    if (header == null) {
                        headerNullRes.push(txInfo.tx_status.block_hash)
                    }
                }
                console.log('failed length:', headerNullRes.length)
                headerNullRes.forEach(hash => console.log(hash))
                expect(headerNullRes.length).to.be.equal(0)
            })
            it('queried for the same block but not collected transaction hash', async () => {

                // { block_number: 0, size: 2 }
                // { block_number: 186, size: 2 } 0xebe3c7ac1d74e14d95ef76637f27584542497dd7d1638b1a087cf49c30ad1274
                // min3scrit : 0xec2ec45230fef85970471fdb685f3c98f2a20c8ce70b6dd65671b08777a06fcc  other : 0x4aef0c97389906f76fcf0214692df30aebbdd1e0a47a02c56cd1f88f404070c5
                // { block_number: 261, size: 2 }
                // { block_number: 270, size: 2 }
                // { block_number: 283, size: 2 }
                // { block_number: 291, size: 2 }

                const containsMinerScriptHash = "0xec2ec45230fef85970471fdb685f3c98f2a20c8ce70b6dd65671b08777a06fcc"
                const otherHashButInSameBlock = "0x4aef0c97389906f76fcf0214692df30aebbdd1e0a47a02c56cd1f88f404070c5"
                let containsMinerScriptResponse = await getTransaction(containsMinerScriptHash)
                let otherHashButInSameBlockResponse = await getTransaction(otherHashButInSameBlock)
                expect(containsMinerScriptResponse).to.be.not.equal(null)
                expect(otherHashButInSameBlockResponse).to.be.equal(null)
            })
            it('query not collected hash,should return null', async () => {
                let header = await getTipHeader()
                let txs = await getTransactionsByBlockNum(BI.from(header.number).toNumber(), rpcCLient)
                for (let i = 0; i < txs.length; i++) {
                    let response = await getTransaction(txs[i])
                    expect(response).to.be.equal(null)
                }

            })
        });
        describe('get_cells', function () {
            it('query collected cells', async () => {

                let cells = await getCellsRequest({
                    limit: "0x10",
                    order: "desc",
                    search_key: {
                        script: MINER_SCRIPT3,
                        script_type: "lock",
                    }
                }, CKB_RPC_INDEX_URL)
                expect(cells.objects.length).to.be.gt(1)

            })
            it('query cells for the same transaction but not collected', async () => {

                let notCollectScript = {
                    code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                    hash_type: "type",
                    args: "0x886d23a7858f12ebf924baaacd774a5e2cf81132"
                }
                let cells = await getCells(notCollectScript)
                expect(cells.objects.length).to.be.equal(0)
            })
        });
        describe('get_transactions', function () {

            it('get exist script,should return data', async () => {
                await waitScriptsUpdate(BI.from(16094))
                let txs1 = await getTransactions({
                    script: MINER_SCRIPT3,
                    filter: {
                        block_range: [BI.from(16094).toHexString(), BI.from(16096).toHexString()],
                    },
                    script_type: "lock",
                }, {sizeLimit: 100})

                let txs2 = await getTransactions({
                    script: MINER_SCRIPT3,
                    filter: {
                        block_range: [BI.from(16000).toHexString(), BI.from(16196).toHexString()],
                    },
                    script_type: "lock",
                }, {sizeLimit: 100, lastCursor: txs1.lastCursor})
                expect(txs1.objects.length).to.be.equal(100)
                expect(txs2.objects.length).to.be.equal(100)
            })
        });
        describe('get_cells_capacity', function () {

            it('get capacity，should > 0', async () => {
                let capacityOnSync = await getCellsCapacity(MINER_SCRIPT3)
                expect(BI.from(capacityOnSync.capacity).toNumber()).to.be.gt(0)
            })

        });
        describe('restart', function () {
            before(async () => {
                await CkbClientNode.stop()
                await CkbClientNode.start()
            })

            it('getScript', async () => {
                let getRet = await getScripts()
                expect(getRet.length).to.be.equal(1)
            })
        });

        describe('script sync to mid ，try again from 0', function () {
            let latestSyncBlockNum;

            let latestTxs;
            before(async () => {
                let currentSyncStatus = await getScripts()
                latestSyncBlockNum = BI.from(currentSyncStatus[0].block_number)

                console.log('latest sync block num:', latestSyncBlockNum.toNumber())
                await setScripts([
                    // {
                    // script: account.lockScript,
                    // block_number: "0x0"
                    // },
                    // miner_script3
                    // cost block num:16095
                    // cost tx: https://pudge.explorer.nervos.org/transaction/0x1850f997f867b6d3f1154444498a15e9fc4ce080215e34d0c41b33349bcc119a
                    {
                        script: MINER_SCRIPT3,
                        script_type: "lock",
                        block_number: "0x0"
                    }])

            })
            describe('get_scripts', function () {
                it('script\'s number begin with 0', async () => {
                    let scriptsResult = await getScripts()
                    // expect(scriptsResult)
                    console.log('script :', scriptsResult)
                    expect(scriptsResult[0].block_number).to.be.equal('0x0')
                })
            });
            describe('get_header', function () {

                it("the hash was collected before the query ", async () => {
                    // cost tx: https://pudge.explorer.nervos.org/transaction/0x1850f997f867b6d3f1154444498a15e9fc4ce080215e34d0c41b33349bcc119a
                    // block : 0x425bb10536e8625ec8caa0d0ad6fbfb71822541eff02ca684eb8661d395152ed
                    let response = await getHeader("0x425bb10536e8625ec8caa0d0ad6fbfb71822541eff02ca684eb8661d395152ed")
                    let responseOfCkb = await getHeader("0x425bb10536e8625ec8caa0d0ad6fbfb71822541eff02ca684eb8661d395152ed", CKB_RPC_URL)
                    // expect(response).to.be.equal(null)
                    expect(JSON.stringify(response)).to.be.equal(JSON.stringify(responseOfCkb))
                })

            });
            describe('get_transaction', function () {
                it("the hash was collected before the query ", async () => {
                    // cost tx: https://pudge.explorer.nervos.org/transaction/0x1850f997f867b6d3f1154444498a15e9fc4ce080215e34d0c41b33349bcc119a
                    let response = await getTransaction("0x1850f997f867b6d3f1154444498a15e9fc4ce080215e34d0c41b33349bcc119a")
                    let responseOfCkb = await getTransaction("0x1850f997f867b6d3f1154444498a15e9fc4ce080215e34d0c41b33349bcc119a", CKB_RPC_URL)
                    expect(JSON.stringify(response.transaction)).to.be.equal(JSON.stringify(responseOfCkb.transaction))
                })
            });

            describe('get_cells', function () {
                it('query cells from the last collection', async () => {
                    let cells = await getCellsRequest({
                        limit: "0x10",
                        order: "desc",
                        search_key: {
                            script: MINER_SCRIPT3,
                            script_type: "lock",
                        }
                    })
                    let height = await getScriptsHeight()
                    cells.objects.map(cell => {
                        expect(BI.from(cell.block_number).toNumber()).to.be.gt(height.toNumber())
                    })
                })
                it('高度未达到上次set_script,get_cell收集的数量不变', async () => {
                    for (let i = 0; i < 100; i++) {
                        let capacity = await getCellsCapacity(MINER_SCRIPT3)
                        let height = await getScriptsHeight()
                        console.log('height:', height.toNumber(), ' cap:', BI.from(capacity.capacity).toNumber())
                    }
                })
            });
            describe('get_transactions', function () {

                it('should > 0 ', async () => {
                    let scriptLength = await getTransactionsLength(MINER_SCRIPT3, undefined, CKB_LIGHT_RPC_URL)
                    expect(scriptLength).to.be.gt(1)
                })

            });
            describe('get_cells_capacity', function () {

                it('should > 0', async () => {
                    let result = await getCellsCapacity(MINER_SCRIPT3)
                    expect(BI.from(result.capacity).toNumber()).to.be.gt(1)
                })

            });
        });
        describe('script [[]]', function () {
            before(async () => {
                await setScripts([])
                let result = await getScripts()
                console.log('result:', result)
                expect(result.toString()).to.be.equal('')
            })
            describe('get_cells', function () {
                it('之前set script的cell不会继续更新', async () => {
                    // console.log('get cell 不会更新')
                    //todo
                })
            });
            describe('getCellsCapacity', function () {
                it('The previous script will not continue to update', async () => {
                    let response = await getCellsCapacity(MINER_SCRIPT3)
                    await Sleep(1000 * 10)
                    let response2 = await getCellsCapacity(MINER_SCRIPT3)
                    expect(response.capacity).to.be.equal(response2.capacity)
                })
            })
        });


    });

    describe('set 几个从中间开始的script', function () {

        //todo
    });

});

async function getTransactionsByBlockNum(number: number, rpc: RPC) {
    let block = await rpc.get_block_by_number(BI.from(number).toHexString())
    return block.transactions.map(transaction => transaction.hash)
}

async function getLiveOutPutByBlockNum(number: number, rpc: RPC): Promise<Output[]> {
    let txs = await getTransactionsByBlockNum(number, rpc)
    let outPuts: Output[] = []
    for (let i = 0; i < txs.length; i++) {
        let cells = await getLiveOutputByTx(txs[i], rpc)
        outPuts.push(...cells)
    }
    return outPuts
}

// todo  mod =>  pipeline
async function getLiveOutputByTx(tx: string, rpc: RPC): Promise<Output[]> {
    let transaction = await rpc.get_transaction(tx)
    let outPuts: Output[] = []
    for (let i = 0; i < transaction.transaction.outputs.length; i++) {
        let cell_status = await rpcCLient.get_live_cell({
            tx_hash: transaction.transaction.hash,
            index: BI.from(i).toHexString(),
        }, true)
        if (cell_status.status == 'live') {
            outPuts.push(transaction.transaction.outputs[i])
        }
    }
    return outPuts
}

async function getTxByScript(scriptObj: ScriptObject) {
    let response = await getTransactions({
        group_by_transaction: true, script: scriptObj, script_type: "lock"
    }, {sizeLimit: 100000})
    return response.objects.map(tx => tx.transaction.hash)
}

async function getScriptsHeight(): Promise<BI> {
    let scriptObj = await getScripts()
    return BI.from(scriptObj[0].block_number)
}

export async function getTransactionsLength(scriptObject: ScriptObject, lastCursor: string, url: string) {
    let totalSize = 0
    while (true) {
        let result = await getTransactions({
            script: scriptObject,
            script_type: "lock",
            group_by_transaction: true
        }, {sizeLimit: 10000, lastCursor: lastCursor}, url)
        if (result.objects.length == 0) {
            break
        }
        totalSize += result.objects.length
        lastCursor = result.lastCursor
        console.log('current totalSize:', totalSize, 'cursor:', lastCursor)
    }
    return totalSize
}

