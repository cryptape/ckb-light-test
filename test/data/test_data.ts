import {rpcCLient} from "../../config/config";
import {BI} from "@ckb-lumos/lumos";
import {Script} from "@ckb-lumos/base/lib/api";
import * as fs from "fs";

export class TestScript {
    script: Script
    hash: string
    block_num: number
    script_type: "lock" | "type"

}

// collection :
// 1.
// script :type
// hash_type: type,data1,data
// 2.
// script: lock
// hash_type: data1,data

export class test_data {

    begin_block_num: number
    end_block_num: number
    script_types: TestScript[]
    script_type_total: number
    script_data_total: number
    script_data1_total: number

    constructor(begin_block_num: number,
                end_block_num: number,
                script_types: TestScript[],
                script_type_total: number,
                script_data_total: number,
                script_data1_total: number) {
        this.begin_block_num = begin_block_num
        this.end_block_num = end_block_num
        this.script_types = script_types
        this.script_type_total = script_type_total
        this.script_data_total = script_data_total
        this.script_data1_total = script_data1_total
    }

    getScriptByHashType(hash_type: string): TestScript[] {
        console.log('getScriptByHashType')
        return this.script_types.filter(
            script => script.script.hash_type == hash_type
        )
    }

    getTxHashList():Set<String>{
        let txs:Set<String>= new Set();
        for (let i = 0; i < this.script_types.length; i++) {
            let spt = this.script_types[i]
            if (txs.has(spt.hash)){
                continue
            }

            txs.add(spt.hash)
        }
        return txs
    }

    getScriptSet(): TestScript[] {
        let scripts: TestScript[] = []
        let test_sort_scripts = this.script_types.sort((ts1, ts2) => {
            if (ts1.block_num > ts2.block_num) {
                return 1
            }
            return -1
        })
        for (let i = 0; i < test_sort_scripts.length; i++) {
            if (scripts.some(spt =>
                spt.script.code_hash == this.script_types[i].script.code_hash &&
                spt.script.args == this.script_types[i].script.args &&
                spt.script.hash_type == this.script_types[i].script.hash_type
            )) {
                continue
            }
            scripts.push(this.script_types[i])
        }
        return scripts

    }

    getScriptByScriptType(script_type: string): TestScript[] {
        return undefined
    }

}

export async function genTestData(begin_block_num: number, end_block_num: number): Promise<test_data> {
    let testScripts: TestScript[] = []
    let script_type_total: number = 0
    let script_data_total: number = 0
    let script_data1_total: number = 0
    let height = await rpcCLient.get_tip_block_number()
    if (BI.from(height).toNumber() < end_block_num) {
        end_block_num = BI.from(height).toNumber()
    }
    for (let i = begin_block_num; i < end_block_num; i++) {
        let response = await rpcCLient.get_block_by_number(BI.from(i).toHexString())

        for (let j = 0; j < response.transactions.length; j++) {
            let tx = response.transactions[j]
            for (let k = 0; k < tx.outputs.length; k++) {
                let outPut = tx.outputs[k]
                if (outPut.type != null) {
                    script_type_total++
                    testScripts.push({
                        script: outPut.type,
                        hash: tx.hash,
                        block_num: i,
                        script_type: "type"
                    })
                }
                if (outPut.lock.hash_type != "type") {
                    if (outPut.lock.hash_type == "data") {
                        script_data_total++
                    }
                    if (outPut.lock.hash_type == "data1") {
                        script_data1_total++
                    }
                    testScripts.push({
                        script: outPut.lock,
                        hash: tx.hash,
                        block_num: i,
                        script_type: "lock"
                    })
                }
            }

        }
        console.log('current block:', i, " script_data_total:", script_data_total, " script_type_total:", script_type_total, " script_data1_total:", script_data1_total)
    }

    return new test_data(
        begin_block_num,
        end_block_num,
        testScripts,
        script_type_total,
        script_data_total,
        script_data1_total)
}


export function writeTestData(td: test_data, path: string) {
    let data = JSON.stringify(td)
    fs.writeFileSync(path, data);
}


export function getTestDataByFile(path: string): test_data {
    const rawData = fs.readFileSync(path)
    let jp = JSON.parse(rawData.toString())
    return new test_data(
        jp.begin_block_num,
        jp.end_block_num,
        jp.script_types,
        jp.script_type_total,
        jp.script_data_total,
        jp.script_data1_total)
}


export interface FilterOption {
    begin_block_num: BI,
    end_block_num: BI,
    filter_hash_type: "type" | "data" | "data1" | undefined,
    script_type: "lock" | "type" | undefined
}

async function getTransactionByFilter(filterOption: FilterOption): Promise<string[]> {

    let txs = []
    for (let i = filterOption.begin_block_num.toNumber(); i < filterOption.end_block_num.toNumber(); i++) {
        let response = await rpcCLient.get_block_by_number(BI.from(i).toHexString())
        txs.push(...response.transactions
            .filter(tx => {
                return tx.outputs.some(output => {
                    switch (filterOption.script_type) {
                        case "lock":
                            return filterOption.filter_hash_type == undefined || output.lock.hash_type == filterOption.filter_hash_type
                        case "type":
                            return output.type != null && (filterOption.filter_hash_type == undefined || output.type.hash_type == filterOption.filter_hash_type)
                        default:
                            return (filterOption.filter_hash_type == undefined || output.lock.hash_type == filterOption.filter_hash_type) || (output.type != null && (filterOption.filter_hash_type == undefined || output.type.hash_type == filterOption.filter_hash_type))
                    }
                })
            }).map(tx => tx.hash)
        )
        console.log('current idx:', i, "txs length:", txs.length)
    }
    return txs
}
