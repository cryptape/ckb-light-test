import {
    getCellsCapacity,
    getCellsCapacityRequest, getCellsRequest,
    getTipHeader,
    setScripts,
    waitScriptsUpdate
} from "../rpc";
import {
    ACCOUNT_PRIVATE, CKB_LIGHT_RPC_URL,
    CKB_RPC_INDEX_URL,
    CKB_RPC_URL,
    EVERY_ONE_CAN_PAY_TYPE_ID,
    MINER_SCRIPT,
} from "../config/config";
import {BI} from "@ckb-lumos/lumos";
import {AGGRON4, generateAccountFromPrivateKey, getBlockNumByTxHash, send_tx} from "../service/transfer";
import {CURRENT_TEST} from "./data.spec";
import {describe} from "mocha";
import {expect} from "chai";
import {getMinBlockNumByCells} from "./get_cells.spec";

describe('get_cells_capacity', function () {

    this.timeout(100000000)
    describe('search_key', function () {

        const snapshot = true
        before(async () => {

            if (snapshot) {
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
                    }, {
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
                return
            }

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
                }, {
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
            // wait light client script update to header
            header = await getTipHeader(CKB_RPC_URL)
            await waitScriptsUpdate(BI.from(header.number), CKB_LIGHT_RPC_URL)

        })

        describe("script", function () {

            describe('hash_type', function () {
                it('data', async () => {
                    await checkScriptCap(CURRENT_TEST.DATA_CELL.cell_output.lock, "lock", 21500000000)
                })
                it('data1', async () => {
                    await checkScriptCap(CURRENT_TEST.DATA1_CELL.cell_output.lock, "lock", 65_00000000)
                })
                it('type', async () => {
                    await checkScriptCap(CURRENT_TEST.TYPE_CELL.cell_output.lock, "lock", 65_00000000)
                })
            });


        })

        describe('script_type', function () {

            it("type", async () => {
                await checkScriptCap(CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type, "type", 150_00000000)
            })
        });
        describe('filter', function () {
            describe('script', function () {
                it("type search lock ,should return cap", async () => {
                    let capOfResult = await getCellsCapacityRequest({
                        search_key: {
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
                    console.log(capOfResult)
                    //https://pudge.explorer.nervos.org/transaction/0x098d34df9e0e17e043ae9a3327891734821e14a5e5a01290265143ed732579e6 #4
                    expect(capOfResult.capacity).to.be.equal("0x37e11d600")
                })

                it("type search type,should return 0x0 ", async () => {
                    let capOfResult = await getCellsCapacityRequest({
                        search_key: {
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
                    console.log(capOfResult)
                    //https://pudge.explorer.nervos.org/transaction/0x098d34df9e0e17e043ae9a3327891734821e14a5e5a01290265143ed732579e6 #4
                    expect(capOfResult.capacity).to.be.equal("0x0")
                })
            });
            describe('output_data_len_range', function () {

                it("[0,1]", async () => {
                    let cellsCapWithoutFilter = await getCellsCapacityRequest({
                        search_key: {
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
                    expect(BI.from(cellsCapWithoutFilter.capacity).toNumber()).to.be.gte(65_00000000)

                    let cellsCapWithOutputRange = await getCellsCapacityRequest({
                        search_key: {
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
                    expect(BI.from(cellsCapWithOutputRange.capacity).toNumber()).to.be.gte(65_00000000)

                    let otherCap = BI.from(cellsCapWithoutFilter.capacity).sub(cellsCapWithOutputRange.capacity)
                    let cellsCapWithOtherOutputRange = await getCellsCapacityRequest({
                        search_key: {
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
                    expect(cellsCapWithOtherOutputRange.capacity).to.be.equal(otherCap.toHexString())
                })
            });
            describe('output_capacity_range', function () {
                it("[15000000000,15000000001]", async () => {
                    let cap = await getCellsCapacityRequest({
                        search_key: {
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
                    // console.log('cel:',cellsWithData.objects.length)
                    expect(BI.from(cap.capacity).toNumber()).to.be.equal(15000000000)


                })

                it("[15000000001,15000000001]", async () => {
                    let cap = await getCellsCapacityRequest({
                        search_key: {
                            script: {
                                code_hash: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.code_hash,
                                hash_type: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.hash_type,
                                args: CURRENT_TEST.DATA_CELL_WITH_TYPE_NOT_EMPTY.cell_output.type.args,
                            },
                            script_type: "type",
                            filter: {
                                output_capacity_range: [BI.from("15000000001").toHexString(), BI.from("1500000000100").toHexString()]
                            }
                        }
                    })
                    // console.log('cel:',cellsWithData.objects.length)
                    expect(BI.from(cap.capacity).toNumber()).to.be.equal(0)


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
                    let cap = await getCellsCapacityRequest({
                        search_key: {
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

                    //https://pudge.explorer.nervos.org/transaction/0x098d34df9e0e17e043ae9a3327891734821e14a5e5a01290265143ed732579e6 #4
                    expect(BI.from(cap.capacity).toNumber()).to.be.equal(150_00000000)
                })


            });
        });
    });

});

async function checkScriptCap(script: { args: string; code_hash: string; hash_type: "type" | "data" | "data1" }, type: "lock" | "type", bi: number) {
    let response = await getCellsCapacityRequest({
        search_key: {
            script: script,
            script_type: type,
        }
    })
    expect(BI.from(response.capacity).toNumber()).equal(bi)
}
