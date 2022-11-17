import {
    GetCellsRequest,
    getCellsRequest,
    getTipHeader, ScriptObject,
    setScripts, waitScriptsUpdate
} from "../rpc";
import {
    ACCOUNT_PRIVATE, EVERY_ONE_CAN_PAY_TYPE_ID,
    CKB_LIGHT_RPC_URL,
    CKB_RPC_URL, MINER_SCRIPT, CKB_RPC_INDEX_URL
} from "../config/config";
import {AGGRON4, generateAccountFromPrivateKey, getBlockNumByTxHash, send_tx} from "../service/transfer";
import {BI} from "@ckb-lumos/lumos";
import {expect} from "chai";
import {getTransactionWaitCommit} from "../service/txService";
import {CURRENT_TEST} from "./data.spec";
import {Cell} from "@ckb-lumos/base/lib/api";

describe('get_cell', function () {

    this.timeout(600_000)


    describe('search_key', function () {

        describe('script', function () {
            describe('code_hash', function () {
                it('length not eq 64 ', async () => {
                    let acc = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)
                    acc.lockScript.code_hash = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce"
                    await getCellsReturnFailed({
                        limit: "0x64", order: "asc", search_key: {
                            script: acc.lockScript,
                            script_type: "lock",
                        }
                    }, CKB_LIGHT_RPC_URL)
                })
            });

            describe('hash_type and args ,with_data', function () {
                let sendTxTransactionResponse;

                const snapshot = true
                before(async () => {
                    if(snapshot){
                        let sendTxHash = "0x098d34df9e0e17e043ae9a3327891734821e14a5e5a01290265143ed732579e6"
                        let setScriptBlockNum = (await getBlockNumByTxHash(sendTxHash)).sub(1)
                        let setScriptBlockNumHex = setScriptBlockNum.toHexString()
                        await setScripts([
                            {
                                script: CURRENT_TEST.DATA1_CELL.cell_output.lock,
                                script_type: "lock",
                                block_number: setScriptBlockNumHex
                            }, {
                                script: CURRENT_TEST.DATA_CELL.cell_output.lock,
                                script_type: "lock",
                                block_number: setScriptBlockNumHex
                            }, {
                                script: CURRENT_TEST.TYPE_CELL.cell_output.lock,
                                script_type: "lock",
                                block_number: setScriptBlockNumHex
                            }, {
                                script: CURRENT_TEST.DATA1_CELL_WITH_TYPE_NOT_EMPTY_1.cell_output.type,
                                script_type: "type",
                                block_number: setScriptBlockNumHex
                            },{
                                script: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type,
                                script_type: "type",
                                block_number: setScriptBlockNumHex
                            },
                            {
                                script: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock,
                                script_type: "lock",
                                block_number: setScriptBlockNumHex
                            }
                        ])
                        await waitScriptsUpdate(setScriptBlockNum.add(10))
                        sendTxTransactionResponse = await getTransactionWaitCommit(sendTxHash, CKB_RPC_URL, 1000)
                        return
                    }

                    //todo add snapshot for test it
                    let acc = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)

                    // setScript at  current height
                    let header = await getTipHeader(CKB_RPC_URL)
                    await setScripts([
                        {
                        script: CURRENT_TEST.DATA1_CELL.cell_output.lock,
                        script_type: "lock",
                        block_number: header.number
                    }, {
                        script: CURRENT_TEST.DATA_CELL.cell_output.lock,
                        script_type: "lock",
                        block_number: header.number
                    }, {
                        script: CURRENT_TEST.TYPE_CELL.cell_output.lock,
                        script_type: "lock",
                        block_number: header.number
                    }, {
                        script: CURRENT_TEST.DATA1_CELL_WITH_TYPE_NOT_EMPTY_1.cell_output.type,
                        script_type: "type",
                        block_number: header.number
                    },{
                        script: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type,
                        script_type: "type",
                        block_number: header.number
                    },
                        {
                            script: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock,
                            script_type: "lock",
                            block_number: header.number
                        }
                    ])


                    // send a transaction ,
                    // the output lock.script's hash_type is type,data,data1

                    let tx = await send_tx({
                        from: acc.address,
                        outputCells: [
                            CURRENT_TEST.DATA1_CELL,
                            CURRENT_TEST.TYPE_CELL,
                            CURRENT_TEST.DATA_CELL,
                            CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY,
                            CURRENT_TEST.DATA1_CELL_WITH_TYPE_NOT_EMPTY_1,

                        ],
                        deps: [
                            {
                                out_point: {
                                    tx_hash: EVERY_ONE_CAN_PAY_TYPE_ID.TX_HASH,
                                    index: EVERY_ONE_CAN_PAY_TYPE_ID.INDEX,
                                },
                                dep_type: AGGRON4.SCRIPTS.SUDT.DEP_TYPE,
                            }
                        ],
                        privKey: ACCOUNT_PRIVATE,
                    })

                    console.log('tx info:', tx)
                    // wait tx On-chain
                    sendTxTransactionResponse = await getTransactionWaitCommit(tx, CKB_RPC_URL, 1000)

                    // wait light client script update to header
                    header = await getTipHeader(CKB_RPC_URL)
                    await waitScriptsUpdate(BI.from(header.number), CKB_LIGHT_RPC_URL)

                })

                describe('hash_type', function () {
                    it('data', async () => {
                        await checkGetCellContainsTx(CURRENT_TEST.DATA_CELL.cell_output.lock, "lock", sendTxTransactionResponse.transaction.hash)
                    })
                    it('data1', async () => {
                        await checkGetCellContainsTx(CURRENT_TEST.DATA1_CELL.cell_output.lock, "lock", sendTxTransactionResponse.transaction.hash)
                    })
                    it('type', async () => {
                        await checkGetCellContainsTx(CURRENT_TEST.TYPE_CELL.cell_output.lock, "lock", sendTxTransactionResponse.transaction.hash)
                    })

                    it.skip('others', async () => {
                        // hash_type is enum ,so can't test it
                        //todo : add not support type to test it

                        let acc = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)
                        // acc.lockScript.hash_type = "others"
                        await getCellsReturnFailed({
                            limit: "0x64", order: "asc", search_key: {
                                script: acc.lockScript,
                                script_type: "lock",
                            }
                        }, CKB_LIGHT_RPC_URL)
                    })
                });


                describe('script_type', function () {
                    it('type', async () => {
                        await checkGetCellContainsTx(CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type, "type", sendTxTransactionResponse.transaction.hash)
                        await checkGetCellContainsTx(CURRENT_TEST.DATA1_CELL_WITH_TYPE_NOT_EMPTY_1.cell_output.type, "type", sendTxTransactionResponse.transaction.hash)
                    })
                });


                describe('args', function () {
                    it("supports prefix search", async () => {

                        let cells = await getCellsRequest({
                            limit: "0x10", order: "asc", search_key: {
                                script: {
                                    code_hash: CURRENT_TEST.DATA_CELL.cell_output.lock.code_hash,
                                    hash_type: "data",
                                    args: "0x",
                                },
                                script_type: "lock"
                            }
                        }, CKB_RPC_INDEX_URL)

                        // supports prefix search: search args:0x, return args:0x1234
                        let containsArgs = cells.objects.some(cell => cell.cell_output.lock.args == CURRENT_TEST.DATA_CELL.cell_output.lock.args)
                        expect(containsArgs).to.be.equal(true)
                    })

                    it(',should return failed', async () => {

                        try {
                            await getCellsRequest({
                                limit: "0x10", order: "asc", search_key: {
                                    script: {
                                        code_hash: CURRENT_TEST.DATA_CELL.cell_output.lock.code_hash,
                                        hash_type: CURRENT_TEST.DATA_CELL.cell_output.lock.hash_type,
                                        args: "",
                                    },
                                    script_type: "type"
                                }
                            })
                        } catch (e) {

                            return
                        }
                        expect("").to.be.equal("failed")


                    })
                    it('null', async () => {
                        try {
                            await getCellsRequest({
                                limit: "0x10", order: "asc", search_key: {
                                    script: {
                                        code_hash: CURRENT_TEST.DATA_CELL.cell_output.lock.code_hash,
                                        hash_type: CURRENT_TEST.DATA_CELL.cell_output.lock.hash_type,
                                        args: null,
                                    },
                                    script_type: "type"
                                }
                            })
                        } catch (e) {

                            return
                        }
                        expect("").to.be.equal("failed")


                    })
                    it('0x', async () => {
                        let cells = await getCellsRequest({
                            limit: "0x10", order: "asc", search_key: {
                                script: {
                                    code_hash: CURRENT_TEST.DATA_CELL.cell_output.lock.code_hash,
                                    hash_type: CURRENT_TEST.DATA_CELL.cell_output.lock.hash_type,
                                    args: "0x",
                                },
                                script_type: "type"
                            }
                        })
                        expect(cells.objects.length).to.be.gte(1)
                    })

                });

                describe('with_data', function () {

                    it("true", async () => {
                        let cellsWithData = await getCellsRequest({
                            limit: "0x10", order: "asc", search_key: {
                                script: {
                                    code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.code_hash,
                                    hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.hash_type,
                                    args: "0x",
                                },
                                script_type: "type",
                                with_data: true
                            }
                        })

                        expect(
                            cellsWithData.objects.some(cell => cell.data != null)
                        ).to.be.equal(true)
                    })
                    it("false", async () => {
                        let cellsWithData = await getCellsRequest({
                            limit: "0x10", order: "asc", search_key: {
                                script: {
                                    code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.code_hash,
                                    hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.hash_type,
                                    args: "0x",
                                },
                                script_type: "type",
                                with_data: false
                            }
                        })

                        expect(
                            cellsWithData.objects.some(cell => cell.data != null)
                        ).to.be.equal(false)
                    });
                    describe('filter', function () {


                        it('{},should return data', async () => {
                            let cellsWithData = await getCellsRequest({
                                limit: "0x10", order: "asc", search_key: {
                                    script: {
                                        code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.code_hash,
                                        hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.hash_type,
                                        args: "0x",
                                    },
                                    script_type: "lock",
                                    with_data: false
                                }
                            })
                            console.log("cell length:", cellsWithData.objects.length)
                            expect(cellsWithData.objects.length).to.be.gte(1)
                        })
                        describe('script', function () {

                            it("lock search lock,should return []", async () => {
                                let cellsWithData = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.code_hash,
                                            hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.hash_type,
                                            args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.args,
                                        },
                                        script_type: "lock",
                                        filter: {
                                            script: {
                                                code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.code_hash,
                                                hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.hash_type,
                                                args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.args,
                                            }
                                        }
                                    }
                                })
                                printCells(cellsWithData.objects)
                                expect(cellsWithData.objects.length).to.be.equal(0)
                            })


                            it("type search lock,should return data", async () => {
                                let cellsWithData = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                            hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                            args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                                        },
                                        script_type: "type",
                                        filter: {
                                            script: {
                                                code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.code_hash,
                                                hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.hash_type,
                                                args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.args,
                                            }
                                        }

                                    }
                                })
                                printCells(cellsWithData.objects)
                                expect(cellsWithData.objects.length).to.be.gte(1)

                            })
                            it("lock search type,should return data", async () => {
                                let cellsWithData = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.code_hash,
                                            hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.hash_type,
                                            args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.lock.args,
                                        },
                                        script_type: "lock",
                                        filter: {
                                            script: {
                                                code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                                hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                                args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                                            }
                                        }
                                    }
                                })
                                printCells(cellsWithData.objects)
                                expect(cellsWithData.objects.length).to.be.gte(1)
                            })
                            it("type search type,should return []", async () => {
                                let cellsWithData = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                            hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                            args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                                        },
                                        script_type: "type",
                                        filter: {
                                            script: {
                                                code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                                hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                                args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                                            }
                                        }
                                    }
                                })
                                printCells(cellsWithData.objects)
                                expect(cellsWithData.objects.length).to.be.equal(0)

                            })
                        });
                        it('script_len_range', async () => {
                            let cellsWithData = await getCellsRequest({
                                limit: "0x10", order: "asc", search_key: {
                                    script: {
                                        code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                        hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                        args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                                    },
                                    script_type: "type",
                                    filter: {
                                        script_len_range: [BI.from("0").toHexString(), BI.from("1").toHexString()]
                                    }
                                }
                            })
                            printCells(cellsWithData.objects)
                            expect(cellsWithData.objects.length).to.be.equal(0)
                        });
                        describe('output_data_len_range', function () {
                            it("[0,1],should return data = \"0x\"", async () => {
                                let cellsWithoutFilter = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA1_CELL.cell_output.lock.code_hash,
                                            hash_type: CURRENT_TEST.DATA1_CELL.cell_output.lock.hash_type,
                                            args: "0x",
                                        },
                                        script_type: "lock",
                                        filter: {
                                            output_data_len_range: [BI.from("0").toHexString(), BI.from("1").toHexString()]
                                        }
                                    }
                                })
                                expect(cellsWithoutFilter.objects.length).to.be.gte(1)

                                let cellsWithData = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA1_CELL.cell_output.lock.code_hash,
                                            hash_type: CURRENT_TEST.DATA1_CELL.cell_output.lock.hash_type,
                                            args: "0x",
                                        },
                                        script_type: "lock",
                                        filter: {
                                            output_data_len_range: [BI.from("0").toHexString(), BI.from("1").toHexString()]
                                        }
                                    }
                                })
                                expect(cellsWithData.objects.length).to.be.gte(1)

                                let otherCellLength = cellsWithoutFilter.objects.length - cellsWithData.objects.length
                                cellsWithData = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA1_CELL.cell_output.lock.code_hash,
                                            hash_type: CURRENT_TEST.DATA1_CELL.cell_output.lock.hash_type,
                                            args: "0x",
                                        },
                                        script_type: "lock",
                                        filter: {
                                            output_data_len_range: [BI.from("1").toHexString(), BI.from("100000000").toHexString()]
                                        }
                                    }
                                })
                                expect(cellsWithData.objects.length).to.be.equal(otherCellLength)
                            })

                        });
                        describe('output_capacity_range', function () {

                            it("[15000000000,15000000001]", async () => {
                                let cellsWithData = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                            hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                            args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                                        },
                                        script_type: "type",
                                        filter: {
                                            output_capacity_range: [BI.from("15000000000").toHexString(), BI.from("15000000001").toHexString()]
                                        }
                                    }
                                })
                                printCells(cellsWithData.objects)
                                // console.log('cel:',cellsWithData.objects.length)
                                expect(cellsWithData.objects.length).to.be.equal(1)


                            })
                            it("[15000000001,15000000000]", async () => {
                                let cellsWithData = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                            hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                            args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                                        },
                                        script_type: "type",
                                        filter: {
                                            output_capacity_range: [BI.from("15000000001").toHexString(), BI.from("15000000000").toHexString()]
                                        }
                                    }
                                })
                                printCells(cellsWithData.objects)
                                expect(cellsWithData.objects.length).to.be.equal(0)
                            })

                        });
                        describe('block_range', function () {


                            // block 0 filter
                            it(" not exit block num ", async () => {
                                let cellsWithData = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                            hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                            args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                                        },
                                        script_type: "type",
                                        filter: {
                                            block_range: ["0x1", "0x2"]
                                        }
                                    }
                                })
                                expect(cellsWithData.objects.length).to.be.equal(0)
                            })

                            it(" exist block num,should return data ", async () => {
                                let cellsWithData = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                            hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                            args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                                        },
                                        script_type: "type",
                                    }
                                })
                                let {minCellsNum, maxCellsNum} = getMinBlockNumByCells(cellsWithData.objects)
                                let cellsWithDataWithRange = await getCellsRequest({
                                    limit: "0x10", order: "asc", search_key: {
                                        script: {
                                            code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                            hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                            args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                                        },
                                        script_type: "type",
                                        filter: {
                                            block_range: [minCellsNum.toHexString(), maxCellsNum.add(1).toHexString()]
                                        }
                                    }
                                })

                                //
                                expect(cellsWithDataWithRange.objects.length).to.be.equal(cellsWithData.objects.length)
                            })


                        });

                    });

                });

            });

        });

    });
    describe('order and limit,last_cursor', function () {
        before(async () => {
            let cells = await getCellsRequest({
                limit: "0xa", order: "desc",
                search_key: {
                    script: MINER_SCRIPT,
                    script_type: "lock"
                }
            }, CKB_RPC_INDEX_URL)

            let {maxCellsNum, minCellsNum} = getMinBlockNumByCells(cells.objects)
            await setScripts([{
                script: MINER_SCRIPT,
                script_type: "lock",
                block_number: minCellsNum.toHexString()
            }])
            await waitScriptsUpdate(maxCellsNum)
        })
        describe('order', function () {
            it('asc', async () => {
                let cells = await getCellsRequest({
                    limit: "0xa", order: "asc",
                    search_key: {
                        script: MINER_SCRIPT,
                        script_type: "lock"
                    }
                })

                // check cells index is asc
                let latestBlockNum = 0
                for (let i = 0; i < cells.objects.length; i++) {
                    expect(BI.from(cells.objects[i].block_number).toNumber()).to.be.gte(latestBlockNum)
                    latestBlockNum = BI.from(cells.objects[i].block_number).toNumber()
                }
            })
            it('desc', async () => {
                let cells = await getCellsRequest({
                    limit: "0xa", order: "desc",
                    search_key: {
                        script: MINER_SCRIPT,
                        script_type: "lock"
                    }
                })

                // check cells index is desc
                let latestBlockNum = 999999999
                for (let i = 0; i < cells.objects.length; i++) {
                    expect(BI.from(cells.objects[i].block_number).toNumber()).to.be.lte(latestBlockNum)
                    latestBlockNum = BI.from(cells.objects[i].block_number).toNumber()
                }
            })
        });
        describe('limit', function () {
            it('0', async () => {
                let cells = await getCellsRequest({
                    limit: "0x0", order: "asc",
                    search_key: {
                        script: MINER_SCRIPT,
                        script_type: "lock"
                    }
                })
                expect(cells.objects.length).to.be.equal(0)
            })
            it('1', async () => {
                let cells = await getCellsRequest({
                    limit: "0x1", order: "asc",
                    search_key: {
                        script: MINER_SCRIPT,
                        script_type: "lock"
                    }
                })
                expect(cells.objects.length).to.be.equal(1)
            })
            it('very big', async () => {
                let cells = await getCellsRequest({
                    limit: "0xfffff", order: "asc",
                    search_key: {
                        script: MINER_SCRIPT,
                        script_type: "lock"
                    }
                })
                expect(cells.objects.length).to.be.lte(BI.from("0xfffff").toNumber())
                cells = await getCellsRequest({
                    limit: "0xfffff", order: "asc",
                    search_key: {
                        script: MINER_SCRIPT,
                        script_type: "lock"
                    },
                    after_cursor: cells.lastCursor
                })
                expect(cells.objects.length).to.be.equal(0)
            })
            it('max > uint32.max,should return failed ', async () => {
                try {
                    let cells = await getCellsRequest({
                        limit: "0xfffffffffffffffffffffffffffffffffffffffffffffffffff", order: "asc",
                        search_key: {
                            script: MINER_SCRIPT,
                            script_type: "lock"
                        }
                    })
                } catch (e) {
                    return
                }
                expect("").to.be.equal("failed")

            })
        });
        describe('after_cursor', function () {
            it('iter', async () => {
                let getCellReq: GetCellsRequest = {
                    limit: "0xfffffff", order: "asc",
                    search_key: {
                        script: MINER_SCRIPT,
                        script_type: "lock"
                    }
                }
                let cells = await getCellsRequest(getCellReq)
                getCellReq.limit = "0x1"
                let allCells = await getAllCellsRequest(getCellReq)
                expect(cells.objects.length).to.be.equal(allCells.length)
                for (let i = 0; i < cells.objects.length; i++) {
                    expect(cells.objects[i].block_number).to.be.equal(allCells[i].block_number)
                }
            })

        });
    });

});

async function getAllCellsRequest(getCellsReq: GetCellsRequest) {
    let allCells = []
    while (true) {
        let cells = await getCellsRequest(getCellsReq)
        if (cells.objects.length == 0) {
            return allCells
        }
        allCells.push(...cells.objects)
        getCellsReq.after_cursor = cells.lastCursor
    }

}

async function checkGetCellContainsTx(checkScript: ScriptObject, script_type: "lock" | "type", txHash: string) {

    let response = await getCellsRequest({
        limit: "0x64", order: "asc", search_key: {
            script: checkScript,
            script_type: script_type,
        }
    }, CKB_LIGHT_RPC_URL)

    console.log("expected : sendTxTransactionResponse.tx_hash:", txHash)
    expect(
        response.objects.some(object => {
            console.log("object.out_point.tx_hash:", object.out_point.tx_hash)
            return object.out_point.tx_hash == txHash
        })
    ).to.be.equal(true)
    console.log("checkGetCellContainsTx pass")
}

async function getCellsReturnFailed(getCellsReq: GetCellsRequest, ckbLightClient: string) {
    try {
        await getCellsRequest(getCellsReq, ckbLightClient)
    } catch (e) {
        console.log("failed:", e)
        return
    }
    expect("").to.be.equals("failed")
}

async function sleep(timeOut: number) {
    await new Promise(r => setTimeout(r, timeOut));
}

export function getMinBlockNumByCells(cells: any[]) {
    let maxCellsNum = BI.from(cells[0].block_number)
    let minCellsNum = BI.from(cells[cells.length - 1].block_number)
    return {maxCellsNum, minCellsNum}
}

function printCells(cells: Cell[]) {
    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i]
        console.log("block num:", BI.from(cell.block_number).toNumber(), " tx_index:", BI.from(cell.out_point.index).toNumber(), "tx_hash:", cell.out_point.tx_hash, "args:", cell.cell_output.lock.args, "type args:", cell.cell_output.type?.args)
    }
}
