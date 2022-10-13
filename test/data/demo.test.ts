import {getTestDataByFile} from "./test_data";
import { CKB_RPC_INDEX_URL} from "../../config/config";
import {BI} from "@ckb-lumos/lumos";
import {getTransactions, setScripts, waitScriptsUpdate} from "../../rpc";
import {getTransactionList} from "../../service/txService";
import * as fs from "fs";
import {expect} from "chai";

describe('demo', function () {
    this.timeout(1000000)

    function getTestDataPath(): string[] {
        return fs.readdirSync("resource").map(file => "resource/" + file)
    }

    let files = getTestDataPath()

    for (let i = 0; i < files.length; i++) {
        describe(files[i], function () {
            let td;
            before(async () => {
                td = getTestDataByFile(files[i])
                let setScriptData = td.getScriptSet().map(t => {
                    return {
                        script: t.script,
                        script_type:t.script_type,
                        block_number: BI.from(t.block_num).toHexString()
                    }
                })
                await setScripts(setScriptData)
                await waitScriptsUpdate(BI.from(td.end_block_num))
            })

            it('getTransactions', async () => {

                let spt = []
                let tds = td.getScriptSet()
                let lightTxs = []
                for (let j = 0; j < tds.length; j++) {
                    let testScpt = tds[j]
                    let indexTxs = await getTransactionList(
                        testScpt.script,
                        testScpt.script_type,
                        undefined,
                        CKB_RPC_INDEX_URL,
                        [BI.from(td.begin_block_num).toHexString(),
                            BI.from(td.end_block_num).toHexString()])
                   let lightTxs =  await getTransactionList(
                        testScpt.script,
                        testScpt.script_type,
                        undefined,
                        CKB_RPC_INDEX_URL,
                        [BI.from(td.begin_block_num).toHexString(),
                            BI.from(td.end_block_num).toHexString()])
                    for (let k = 0; k < indexTxs.length; k++) {
                        spt.push(indexTxs[k])
                    }
                    for (let k = 0; k < lightTxs.length; k++) {
                        lightTxs.push(lightTxs[k])
                    }

                }

                let tdList = td.getTxHashList()
                let uniqueList =  unique(spt)
                let uniqueLightList = unique(lightTxs)
                console.log('getTransactionList Length:',uniqueList.length)
                console.log('td.script_types length:', tdList.length)
                console.log('light client length:',uniqueLightList.length)
                let diffHashList = uniqueList.filter(tx=> !tdList.some(tdHash=> tdHash == tx))
                let diffLightResult = uniqueLightList.filter(tx =>!tdList.some(tdHash=>tdHash == tx))
                diffHashList.forEach(txHash=>{
                    console.log("diff:",txHash)
                })
                console.log('light -----')
                diffLightResult.forEach(txHash=>{
                    console.log("diff:",txHash)
                })
                expect(diffHashList.length).to.be.equal(diffLightResult.length)

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
