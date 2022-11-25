import {expect} from 'chai'
import {CkbClientNode, lightClientRPC, MINER_SCRIPT, rpcCLient} from "../config/config";
import {AGGRON4} from "../service/transfer";
import {Script} from "@ckb-lumos/base";
import {BI} from "@ckb-lumos/bi";
import {LightClientScript} from "@ckb-lumos/light-client/src/type";
import {waitScriptsUpdate} from "../service/lightService";

describe('set_scripts', function () {

    this.timeout(10000000)
    it('set [[]],should return null,getScript should return [[]]', async () => {

        // set [[]]
        let result = await lightClientRPC.setScripts([])
        expect(result).to.be.equal(null)

        // get script should return []]
        let get_result = await lightClientRPC.getScripts()
        expect(get_result.length).to.be.equal(0)
    })


    it('Set duplicate scripts but different heights, should return null, query get_scripts, return the last script height', async () => {

        let testScript: Script = {
            codeHash: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
            hashType: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
            args: "0x1234"
        };

        // set dup scripts
        let result = await lightClientRPC.setScripts([{
            script: testScript,
            scriptType: "lock",
            blockNumber: "0xffffffffff"
        }, {
            script: testScript,
            scriptType: "lock",
            blockNumber: "0xffff"
        },
            {
                script: testScript,
                scriptType: "lock",
                blockNumber: "0xffffffff"
            },

        ])
        expect(result).to.be.equal(null)

        // get scripts
        let result1 = await lightClientRPC.getScripts()
        expect(result1.length).to.be.equal(1)
        expect(result1[0].blockNumber).to.be.equal("0xffffffff")
        expect(result1[0].script.args).to.be.equal(testScript.args)
        expect(result1[0].script.codeHash).to.be.equal(testScript.codeHash)
        expect(result1[0].script.hashType).to.be.equal(testScript.hashType)

    })

    it('set with too many scripts,should return null', async () => {

        const size = 10000;
        let scripts: LightClientScript[] = [];

        for (let i = 0; i < size; i++) {
            let arg = BI.from(i).toHexString()
            if (arg.length % 2 == 1) {
                arg = arg.replace('0x', '0x0')
            }
            scripts.push({
                script: {
                    codeHash: "0x8d9fac0888592070fa807f715340395511eed95f8d981afbc7b3c95ea5ff8081",
                    hashType: "type",
                    args: arg
                },
                scriptType: "lock",
                blockNumber: "0x11"
            })
        }
        await lightClientRPC.setScripts(scripts)
        const scriptsGet = await lightClientRPC.getScripts()
        expect(scriptsGet.length).to.be.equal(size)


    })

    it.skip('set with too many scripts, should return null, get_scripts can query all scripts in the set', async () => {
        //todo
        //返回null
        // get_scripts 能查询到set的所有scripts
        let scripts = new Set()
        let scriptsSet = new Set()

        for (let i = 150; i < 10000000; i++) {
            let scriptsTem = await getScriptsByBlockNum(BI.from(i))
            for (let j = 0; j < scriptsTem.length; j++) {
                if (scriptsSet.has(JSON.stringify(scriptsTem[j]))) {
                    continue
                }
                scriptsSet.add(JSON.stringify(scriptsTem[j]))
                scripts.add(scriptsTem[j])
            }
            console.log('block num', i, 'scripts length :', scripts.size)

            // @ts-ignore
            let temScriptsData = []
            let entryScript = scripts.entries()
            scripts.forEach(value => {
                temScriptsData.push({
                    script: value,
                    blockNumber: "0x1"
                })
            })

            if (temScriptsData.length > 0) {
                // @ts-ignore
                await setScripts(temScriptsData)
                await lightClientRPC.getScripts()
            }
        }
    })


    describe('script', function () {
        describe('codeHash', function () {
            it("codeHash length not eq 64, return an error", async () => {
                await setScriptRequestReturnFailed([{
                    script: {
                        codeHash: "0x1234111",
                        hashType: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, scriptType: "lock", blockNumber: "0xffff"
                }])
            })
        });
        describe('hash_type', function () {
            // it('hash_type not exist,should return error', async () => {
            //     await setScriptRequestReturnFailed([{
            //         script: {
            //             code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce1",
            //             hashType: "type1asdasd`🦚\"？?\\\"\"\\\"\"\"\\u0000？？？?\"\\\\\"{?}{:?}`asda",
            //             args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
            //         }, scriptType:"lock",blockNumber: "0xffff"
            //     }])
            // })

            // it('hash_type is "",should return error ', async () => {
            //     await setScriptRequestReturnFailed([{
            //         script: {
            //             code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce1",
            //             hashType: "",
            //             args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
            //         },scriptType:"lock", blockNumber: "0xfff"
            //     }])
            // })

            it('hash_type data ', async () => {

                await lightClientRPC.setScripts([{
                    script: {
                        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hashType: "data",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, scriptType: "lock", blockNumber: "0xffff"
                }])
                await lightClientRPC.getScripts()
                //todo cell script

            })

            it('hash_type data1 ', async () => {

                //todo query cell data1
                await lightClientRPC.setScripts([{
                    script: {
                        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hashType: "data1",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, scriptType: "lock", blockNumber: "0xffff"
                }])
                await lightClientRPC.getScripts()
            })

            it('hash_type type ', async () => {

                await lightClientRPC.setScripts([{
                    script: {
                        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hashType: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, scriptType: "lock", blockNumber: "0xffff"
                }])
                await lightClientRPC.getScripts()
            })

            it('hash_type type is null ', async () => {

                await setScriptRequestReturnFailed([{
                    script: {
                        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hashType: undefined,
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, scriptType: "lock", blockNumber: "0xffff"
                }])
            })

        });
        describe('args', function () {
            it('arg is undefined,should return error msg', async () => {
                await setScriptRequestReturnFailed([{
                    script: {
                        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hashType: "type",
                        args: undefined
                    }, scriptType: "lock", blockNumber: "0xffff"
                }])
            })

            it('arg  is null,should return error msg ', async () => {
                await setScriptRequestReturnFailed([{
                    script: {
                        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hashType: "type",
                        args: null
                    }, scriptType: "lock", blockNumber: "0xffff"
                }])
            })

            it('arg is very large,should send success,return null', async () => {
                let argData = "0x";
                for (let i = 0; i < 100000; i++) {
                    argData = argData + "ffffff"
                }
                await lightClientRPC.setScripts([{
                    script: {
                        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hashType: "type",
                        args: argData
                    }, scriptType: "lock", blockNumber: "0xffff"
                }])
                let result = await lightClientRPC.getScripts()
                expect(result[0].script.args).to.be.equal(argData)
            })

        });

        describe('block number', function () {
            it.skip('block number is overflow,should return failed msg', async () => {
                await setScriptRequestReturnFailed([{
                    script: {
                        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                        hashType: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, scriptType: "lock", blockNumber: "0xffffffffffffffff"
                }])
                await waitScriptsUpdate(BI.from("12345678"))

            });

            it('set script height > tipHeader height ,should wait light-client update data ,', async () => {


                // set script that height = latest height +2
                const tipMsg = await lightClientRPC.getTipHeader()
                const setHeight = BI.from(tipMsg.number).add(2)
                const result = await lightClientRPC.setScripts([{
                    script: {
                        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                        hashType: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, scriptType: "lock", blockNumber: setHeight.toHexString()
                }])
                expect(result).to.be.equal(null)

                await waitScriptsUpdate(setHeight.add(1))

            })

            it('script number < tipHeader.block_number,will update now ', async () => {

                //get latest height
                let tipMsg = await lightClientRPC.getTipHeader()

                // set script that height = tipHeader height / 2
                let setHeight = BI.from(tipMsg.number).div(2)
                let result = await lightClientRPC.setScripts([{
                    script: {
                        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                        hashType: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, scriptType: "lock", blockNumber: setHeight.toHexString()
                }])
                expect(result).to.be.equal(null)

                // get script after 10s
                await Sleep(10 * 1000)
                const script = await lightClientRPC.getScripts()
                let current_update_blockNumber = script[0].blockNumber

                // get script height must > set script height
                expect(BI.from(current_update_blockNumber).sub(setHeight).toNumber()).to.be.gte(0)

            })

        });

    });

});

async function Sleep(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * get all output type scripts and lock scripts from block(contains deduplication)
 * @param blockNum
 */
async function getScriptsByBlockNum(blockNum: BI): Promise<Script[]> {
    let blockMsg = await rpcCLient.getBlockByNumber(blockNum.toHexString())
    let scripts = []
    if (blockMsg == null || blockMsg.transactions == undefined) {
        return []
    }
    for (let i = 0; i < blockMsg.transactions.length; i++) {
        let outputCell = blockMsg.transactions[i].outputs.pop()
        if (outputCell == undefined) {
            continue
        }
        if (outputCell.type != undefined) {
            scripts.push(outputCell.type)
        }
        scripts.push(outputCell.lock)
    }
    return scripts
}

async function setScriptRequestReturnFailed(scripts: LightClientScript[], msg: string = "") {
    try {
        await lightClientRPC.setScripts(scripts)
    } catch (e) {
        console.log(e)
        if (msg != "") {
            expect(e.toString()).to.be.include(msg)
        }
        return
    }
    expect("").to.be.equal("failed")
}
