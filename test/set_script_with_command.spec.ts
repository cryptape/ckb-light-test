import {CKB_LIGHT_RPC_URL, CkbClientNode, lightClientRPC, MINER_SCRIPT, MINER_SCRIPT3, script} from "../config/config";
import {LightClientScript, ScriptType} from "@ckb-lumos/light-client/src/type";
import {request} from "../service";
import {expect} from "chai";
import {Sleep} from "../service/util";
import {HexNumber, Script} from "@ckb-lumos/base";
import {BI} from "@ckb-lumos/lumos";
import {getCellsCapacityRequest, waitScriptsUpdate} from "../service/lightService";

describe('set_script_with_command', function () {


    this.timeout(1000_00000)
    let beforeSet: LightClientScript[]
    beforeEach(async () => {
        await setScriptWithCommand([], "all")
        await setScriptWithCommand([
            {script: MINER_SCRIPT, scriptType: "lock", blockNumber: "0x0"}
        ], "all")
        beforeSet = await lightClientRPC.getScripts()
    })
    describe('all', function () {

        it("[],should empty all script", async () => {
            const beforeSet = await lightClientRPC.getScripts()
            expect(beforeSet.toString()).to.be.not.equal("")
            await setScriptWithCommand([], "all")
            const rt = await lightClientRPC.getScripts()
            expect(rt.toString()).to.be.equal("")
        })

        it("[new scripts list],should replace all scripts", async () => {
            const beforeSet = await lightClientRPC.getScripts()
            const setNewScript: LightClientScript = {
                script: {
                    codeHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    args: "0x",
                    hashType: "type"
                },
                scriptType: "lock",
                blockNumber: "0x0"
            }
            await setScriptWithCommand([
                setNewScript
            ], "all")
            const afterSet = await lightClientRPC.getScripts()
            console.log("before set :", beforeSet)
            console.log("after set :", afterSet)
            expect(afterSet[0].script).to.be.deep.equal(setNewScript.script)
            expect(beforeSet[0].script).to.be.deep.equal(MINER_SCRIPT)
        })
    });

    describe('partial', function () {
        it("[],should nothing", async () => {

            let res = await setScriptWithCommand([], "partial")
            console.log("res:", res)
            const afterSet = await lightClientRPC.getScripts()
            console.log("afterSet:", afterSet)
            expect(afterSet[0].script).to.be.deep.equal(MINER_SCRIPT)
        })
        it("[before scripts is empty],should add new scripts", async () => {
            await setScriptWithCommand([], "all")
            await Sleep(1000)
            const setNewScript: LightClientScript = {
                script: {
                    codeHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    args: "0x",
                    hashType: "type"
                },
                scriptType: "lock",
                blockNumber: "0x0"
            }
            await setScriptWithCommand([
                setNewScript
            ], "partial")
            let afterSet = await lightClientRPC.getScripts()
            console.log("after set:", afterSet)
            expect(afterSet[0].script).to.be.deep.equal(setNewScript.script)

        })
        it("[exist script,but height not eq ],should replace height for script", async () => {
            await setScriptWithCommand([
                {
                    script: beforeSet[0].script,
                    scriptType: beforeSet[0].scriptType,
                    blockNumber: "0xffff",
                }
            ], "partial")
            let afterSet = await lightClientRPC.getScripts()
            expect(afterSet[0].script).to.be.deep.equal(beforeSet[0].script)
            expect(afterSet[0].blockNumber).to.be.equal("0xffff")
        })

        it("[script same ,but scriptType not eq]，should add script", async () => {
            let beforeSet = await lightClientRPC.getScripts()
            await setScriptWithCommand([
                {
                    script: beforeSet[0].script,
                    scriptType: "type",
                    blockNumber: "0xffff",
                }
            ], "partial")
            let afterSet = await lightClientRPC.getScripts()
            expect(afterSet.length).to.be.equal(2)
        })
        it("[not exist script],should add script", async () => {
            const setNewScript: LightClientScript = {
                script: {
                    codeHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    args: "0x",
                    hashType: "type"
                },
                scriptType: "lock",
                blockNumber: "0x0"
            }
            await setScriptWithCommand([
                setNewScript
            ], "partial")
            const scripts = await lightClientRPC.getScripts()
            expect(scripts.length).to.be.equal(2)
            const ret = scripts.some(script => {
                return script.script.codeHash == setNewScript.script.codeHash
                    && script.script.hashType == setNewScript.script.hashType
                    && script.script.args == setNewScript.script.args
                    && script.scriptType == setNewScript.scriptType
                    && script.blockNumber == setNewScript.blockNumber
            })
            expect(ret).to.be.equal(true)
        })
    });

    describe('delete', function () {

        it("[],nothing", async () => {
            await setScriptWithCommand([], "delete")
            const ret = await lightClientRPC.getScripts()
            console.log("ret:", ret)
            expect(beforeSet).to.be.deep.equal(ret)
        })
        it("only script eq ,should nothing", async () => {
            await setScriptWithCommand([{
                script: beforeSet[0].script, scriptType: "type", blockNumber: "0x1234"
            }], "delete")
            const ret = await lightClientRPC.getScripts()
            console.log("ret:", ret)
            expect(beforeSet).to.be.deep.equal(ret)
        })
        it("only script_type eq,should nothing", async () => {
            await setScriptWithCommand([{
                script: {
                    codeHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    args: "0x",
                    hashType: "type"
                }, scriptType: "lock", blockNumber: "0x1234"
            }], "delete")
            const ret = await lightClientRPC.getScripts()
            expect(beforeSet).to.be.deep.equal(ret)
        })
        it("script and script_type are eq , should remove succ ，get_script not found remove script", async () => {
            await setScriptWithCommand([{
                script: beforeSet[0].script, scriptType: beforeSet[0].scriptType, blockNumber: "0x1234"
            }], "delete")
            const ret = await lightClientRPC.getScripts()
            expect(ret.length).to.be.equal(0)
        })
        it("not exist script,nothing", async () => {
            await setScriptWithCommand([
                {
                    script: {
                        codeHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                        args: "0x",
                        hashType: "type"
                    }, scriptType: "lock", blockNumber: "0x1234"
                }], "delete")
            const afterSet = await lightClientRPC.getScripts()
            expect(beforeSet).to.be.deep.equal(afterSet)
        })

    });

});


// describe('set_script_with_command_mix', function () {
//
//     this.timeout(100000000)
//
//     it("issue119(https://github.com/nervosnetwork/ckb-light-client/issues/119)", async () => {
//         await CkbClientNode.clean()
//         await CkbClientNode.start()
//         await CkbClientNode.status()
//         const scripts = getRandScripts(1, 3000, 0);
//         await setScriptWithCommand(scripts, "all")
//         await waitScriptsUpdate(BI.from("1000"))
//         await setScriptWithCommand([], "all")
//         await Sleep(1000 * 30)
//     })
//
//
//     it("put remove ", async () => {
//         for (let i = 0; i < 10; i++) {
//             const scripts = getRandScripts(1000 * i, 1000 * i + 2000, 0);
//             await setScriptWithCommand(scripts, "partial")
//             await waitScriptsUpdate(BI.from("1000"))
//             let getScripts = await lightClientRPC.getScripts()
//             getScripts.pop()
//             await setScriptWithCommand(getScripts, "delete")
//             let getAfterRemoveScripts = await lightClientRPC.getScripts()
//             expect(getAfterRemoveScripts.length).to.be.equal(1)
//             console.log("script", getAfterRemoveScripts)
//         }
//
//     })
//
//     it("partial", async () => {
//
//         for (let i = 0; i < 10000000; i++) {
//             const scripts = getRandScripts(1000 * i, 1000 * i + 1000, 100);
//             await setScriptWithCommand(scripts, "partial")
//             // await Sleep(500)
//         }
//
//     })
//
//     it("delete all", async () => {
//         let scripts = await lightClientRPC.getScripts()
//         console.log("scripts:", scripts.length)
//         scripts.pop()
//         await setScriptWithCommand(scripts, "delete")
//         scripts = await lightClientRPC.getScripts()
//         console.log("scripts length:", scripts.length)
//     })
//
//
//     it("delete", async () => {
//
//         for (let i = 0; i < 10000000; i++) {
//             const scripts = getRandScripts(1000 * i, 1000 * i + 500, 100);
//             await setScriptWithCommand(scripts, "delete")
//         }
//
//     })
//     it("sada",async ()=>{
//         await setScriptWithCommand([],"all")
//     })
//
//     it("get script", async () => {
//         for (let i = 0; i < 1000000; i++) {
//             const scripts = await lightClientRPC.getScripts()
//             scripts.forEach(script => {
//                 BI.from(script.script.args)
//             })
//             console.log(scripts.length)
//             await Sleep(500)
//         }
//     })
// })

function getRandScripts(beginNum: number, endNum: number, blockNo: number): LightClientScript[] {
    let scripts = []
    for (let i = beginNum; i < endNum; i++) {
        let args = BI.from(i).toHexString()
        if (args.length % 2 == 1) {
            args = args.replace("0x", "0x0")
        }
        scripts.push({
            script: {
                codeHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                hashType: "type",
                args: args
            },
            blockNumber: BI.from(blockNo).toHexString(),
            scriptType: "lock"
        })
    }
    return scripts
}


export async function setScriptWithCommand(scripts: Array<LightClientScript>, setScriptCommand: "all" | "partial" | "delete" | "partial1") {

    const params = [
        scripts.map(({script, scriptType, blockNumber}) => ({
            script: {
                code_hash: script.codeHash,
                hash_type: script.hashType,
                args: script.args,
            },
            script_type: scriptType,
            block_number: blockNumber,
        })), setScriptCommand
    ];
    return request(1, CKB_LIGHT_RPC_URL, "set_scripts", params)
}
