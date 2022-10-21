import {getScripts, getTipHeader, ScriptMsg, setScripts, waitScriptsUpdate} from "../rpc";
import {expect} from 'chai'
import {CkbClientNode, MINER_SCRIPT, rpcCLient} from "../config/config";
import {AGGRON4} from "../service/transfer";
import {Script} from "@ckb-lumos/base";
import {BI} from "@ckb-lumos/lumos";

describe('set_scripts', function () {

    this.timeout(10000000)
    it('set [[]],should return null,getScript should return [[]]', async () => {

        // set [[]]
        let result = await setScripts([])
        expect(result).to.be.equal(null)

        // get script should return []]
        result = await getScripts()
        expect(result.toString()).to.be.equal("")
    })


    it('Set duplicate scripts but different heights, should return null, query get_scripts, return the last script height', async () => {

        let testScript = {
            code_hash: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
            hash_type: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
            args: "0x1234"
        };

        // set dup scripts
        let result = await setScripts([{
            script: testScript,
            script_type:"lock",
            block_number: "0xffffffffff"
        }, {
            script: testScript,
            script_type:"lock",
            block_number: "0xffff"
        },
            {
                script: testScript,
                script_type:"lock",
                block_number: "0xffffffff"
            },

        ])
        expect(result).to.be.equal(null)

        // get scripts
        let result1 = await getScripts()
        expect(result1.length).to.be.equal(1)
        expect(result1[0].block_number).to.be.equal("0xffffffff")
        expect(result1[0].script.args).to.be.equal(testScript.args)
        expect(result1[0].script.code_hash).to.be.equal(testScript.code_hash)
        expect(result1[0].script.hash_type).to.be.equal(testScript.hash_type)

    })

    it('set with too many scripts,should return null',async ()=>{

        const  size = 33000;
        let scripts:ScriptMsg[] = [];

        for (let i = 0; i < size; i++) {
            let arg = BI.from(i).toHexString()
            if (arg.length%2 == 1){
                arg = arg.replace('0x','0x0')
            }
            scripts.push({script:{
                    code_hash:"0x8d9fac0888592070fa807f715340395511eed95f8d981afbc7b3c95ea5ff8081",
                    hash_type:"type",
                    args:arg
                },
                script_type:"lock",
                block_number:"0x11"})
        }
        await setScripts(scripts)
        const scriptsGet = await getScripts()
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
                    block_number: "0x1"
                })
            })

            if (temScriptsData.length > 0) {
                // @ts-ignore
                await setScripts(temScriptsData)
                await getScripts()
            }
        }
    })


    describe('script', function () {
        describe('codeHash', function () {
            it("codeHash length not eq 64, return an error", async () => {
                await setScriptRequestReturnFailed([{
                    script: {
                        code_hash: "0x1234",
                        hash_type: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    },script_type:"lock", block_number: "0xffff"
                }])
            })
        });
        describe('hash_type', function () {
            it('hash_type not exist,should return error', async () => {
                await setScriptRequestReturnFailed([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce1",
                        hash_type: "type1asdasd`🦚\"？?\\\"\"\\\"\"\"\\u0000？？？?\"\\\\\"{?}{:?}`asda",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, script_type:"lock",block_number: "0xffff"
                }])
            })

            it('hash_type is "",should return error ', async () => {
                await setScriptRequestReturnFailed([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce1",
                        hash_type: "",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    },script_type:"lock", block_number: "0xfff"
                }])
            })

            it('hash_type data ', async () => {

                await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hash_type: "data",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, script_type:"lock",block_number: "0xffff"
                }])
                await getScripts()
                //todo cell script

            })

            it('hash_type data1 ', async () => {

                //todo query cell data1
                await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hash_type: "data1",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    },script_type:"lock", block_number: "0xffff"
                }])
                await getScripts()
            })

            it('hash_type type ', async () => {

                await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hash_type: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, script_type:"lock",block_number: "0xffff"
                }])
                await getScripts()
            })

            it('hash_type type is null ', async () => {

                await setScriptRequestReturnFailed([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hash_type: undefined,
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    },script_type:"lock", block_number: "0xffff"
                }])
            })

        });
        describe('args', function () {
            it('arg is undefined,should return error msg', async () => {
                await setScriptRequestReturnFailed([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hash_type: "type",
                        args: undefined
                    }, script_type:"lock",block_number: "0xffff"
                }])
            })

            it('arg  is null,should return error msg ', async () => {
                await setScriptRequestReturnFailed([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hash_type: "type",
                        args: null
                    }, script_type:"lock",block_number: "0xffff"
                }])
            })

            it('arg is very large,should send success,return null', async () => {
                let argData = "0x";
                for (let i = 0; i < 100000; i++) {
                    argData = argData + "ffffff"
                }
                await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hash_type: "type",
                        args: argData
                    },script_type:"lock", block_number: "0xffff"
                }])
                let result = await getScripts()
                expect(result[0].script.args).to.be.equal(argData)
            })

        });

        describe('block number', function () {
            it.skip('block number is overflow,should return failed msg', async () => {
                await setScriptRequestReturnFailed([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                        hash_type: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    },script_type:"lock", block_number: "0xffffffffffffffff"
                }])
                await waitScriptsUpdate(BI.from("12345678"))

            });

            it('set script height > tipHeader height ,should wait light-client update data ,', async () => {


                // set script that height = latest height +2
                const tipMsg = await getTipHeader()
                const setHeight = BI.from(tipMsg.number).add(2)
                const result = await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                        hash_type: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, script_type:"lock",block_number: setHeight.toHexString()
                }])
                expect(result).to.be.equal(null)

                await waitScriptsUpdate(setHeight.add(1))

            })

            it('script number < tipHeader.block_number,will update now ', async () => {

                //get latest height
                let tipMsg = await getTipHeader()

                // set script that height = tipHeader height / 2
                let setHeight = BI.from(tipMsg.number).div(2)
                let result = await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                        hash_type: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    },script_type:"lock", block_number: setHeight.toHexString()
                }])
                expect(result).to.be.equal(null)

                // get script after 10s
                await Sleep(10 * 1000)
                const script = await getScripts()
                let current_update_block_number = script[0].block_number

                // get script height must > set script height
                expect(BI.from(current_update_block_number).sub(setHeight).toNumber()).to.be.gte(0)

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
    let blockMsg = await rpcCLient.get_block_by_number(blockNum.toHexString())
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

async function setScriptRequestReturnFailed(scripts: ScriptMsg[], msg: string = "") {
    try {
        await setScripts(scripts)
    } catch (e) {
        console.log(e)
        if (msg != "") {
            expect(e.toString()).to.be.include(msg)
        }
        return
    }
    expect("").to.be.equal("failed")
}
