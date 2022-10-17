import {getTestDataByFile} from "./test_data";
import {CKB_LIGHT_RPC_URL, CKB_RPC_INDEX_URL, CkbClientNode} from "../../config/config";
import {BI} from "@ckb-lumos/lumos";
import {getTransactions, setScripts, waitScriptsUpdate,} from "../../rpc";
import {getTransactionList} from "../../service/txService";
import {expect} from "chai";
import * as fs from "fs";

describe('demo', function () {
    this.timeout(1000000000)
    let idx = 0
    let step = 1

    function SkipStep(step: number): boolean {
        idx++
        return (idx % step) == 0
    }


    function getTestDataPath(): string[] {
        return fs.readdirSync("resource").map(file => "resource/" + file)
        // return ["resource/test-1755000-1760000.json"]
    }

    let files = getTestDataPath()


    for (let i = 0; i < files.length; i++) {
        if (!SkipStep(step)) continue;
        describe(files[i], function () {
            let td;
            before(async () => {
                await CkbClientNode.clean()
                await CkbClientNode.start()
                await CkbClientNode.status()
                td = getTestDataByFile(files[i])
                let setScriptData = td.getScriptSet().map(t => {
                    let minUpdateNum: BI
                    if (BI.from(t.block_num).eq(BI.from(0))) {
                        minUpdateNum = BI.from(t.block_num)
                    } else {
                        minUpdateNum = BI.from(t.block_num).sub(BI.from(1))
                    }
                    return {
                        script: t.script,
                        script_type: t.script_type,
                        block_number: minUpdateNum.toHexString()
                    }
                })
                await setScripts(setScriptData)
                await waitScriptsUpdate(BI.from(td.end_block_num))
            })

            it('getTransactions', async () => {

                let indexTotalTxs: Set<String> = new Set()
                let tds = td.getScriptSet()
                let lightTotalTxs: Set<String> = new Set()
                for (let j = 0; j < tds.length; j++) {
                    let testScpt = tds[j]
                    let indexTxs = await getTransactionList(
                        testScpt.script,
                        testScpt.script_type,
                        undefined,
                        CKB_RPC_INDEX_URL,
                        [BI.from(td.begin_block_num).toHexString(),
                            BI.from(td.end_block_num).toHexString()])
                    let lightTxs = await getTransactionList(
                        testScpt.script,
                        testScpt.script_type,
                        undefined,
                        CKB_LIGHT_RPC_URL,
                        [BI.from(td.begin_block_num).toHexString(),
                            BI.from(td.end_block_num).toHexString()])
                    for (let k = 0; k < indexTxs.length; k++) {
                        indexTotalTxs.add(indexTxs[k])
                    }
                    for (let k = 0; k < lightTxs.length; k++) {
                        lightTotalTxs.add(lightTxs[k])
                    }

                }

                let tdList: Set<String> = td.getTxHashList()
                // let uniqueIndexList =  unique(indexTotalTxs)
                // let uniqueLightList = unique(lightTotalTxs)
                console.log('getTransactionList Length:', indexTotalTxs.size)
                console.log('td.script_types length:', tdList.size)
                console.log('light client length:', lightTotalTxs.size)
                let diffIndexHashNotInTdListResult = [];
                indexTotalTxs.forEach(tx => {

                    if (!tdList.has(tx)) {
                        diffIndexHashNotInTdListResult.push(tx)
                    }
                })
                let diffLightNotInTdListResult = [];
                lightTotalTxs.forEach(tx => {
                    if (!tdList.has(tx)) {
                        diffLightNotInTdListResult.push(tx)
                    }
                })
                console.log('--- index not in td list -----')
                diffIndexHashNotInTdListResult.forEach(txHash => {
                    console.log("diff:", txHash)
                })
                console.log('---light not in td list  -----')
                diffLightNotInTdListResult.forEach(txHash => {
                    console.log("diff:", txHash)
                })
                expect(diffIndexHashNotInTdListResult.length).to.be.equal(diffLightNotInTdListResult.length)
                expect(lightTotalTxs.size).to.be.gte(tdList.size)
            })


        });
    }

});

function unique(arr: string[]): string[] {
    if (!Array.isArray(arr)) {
        console.log('type error!')
        return
    }
    var array = [];
    for (var i = 0; i < arr.length; i++) {
        if (!array.includes(arr[i])) {
            array.push(arr[i]);
        }
    }
    return array
}
