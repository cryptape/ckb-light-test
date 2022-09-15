import {getScripts, getTipHeader, setScripts} from "../rpc";
import {expect} from 'chai'
import {rpcCLient, script} from "../config/config";
import {AGGRON4} from "../service/transfer";
import {Script} from "@ckb-lumos/base";
import {BI} from "@ckb-lumos/lumos";

describe('set_scripts', function () {

    this.timeout(10000000)
    it('set [[]],should return null,getScript should return [[]]',async ()=>{

        // set [[]]
        let result = await setScripts([])
        expect(result).to.be.equal(null)

        // get script should return []]
        result = await getScripts()
        expect(result.toString()).to.be.equal("")
    })

    it('set duplicate scripts,should clean up duplicate data ',async ()=>{


        let testScrit = {
            code_hash:AGGRON4.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
            hash_type:AGGRON4.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
            args:"0x"
        };

        // set dup scripts
        let result = await setScripts([{
            script:testScrit,
            block_number:"0xffffffffff"
        },{
            script:testScrit,
            block_number:"0xffffffffff"
        }])
        expect(result).to.be.equal(null)

        // get scripts
        let result1 = await getScripts()
        expect(result1.length).to.be.equal(1)
        expect(result1[0].block_number).to.be.equal("0xffffffffff")
        expect(result1[0].script.args).to.be.equal(testScrit.args)
        expect(result1[0].script.code_hash).to.be.equal(testScrit.code_hash)
        expect(result1[0].script.hash_type).to.be.equal(testScrit.hash_type)

    })
    it('set 重复的script但高度不一样,should 返回null，query get_scripts return lower script ',async ()=>{

        let testScrit = {
            code_hash:AGGRON4.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
            hash_type:AGGRON4.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
            args:"0x1234"
        };

        // set dup scripts
        let result = await setScripts([{
            script:testScrit,
            block_number:"0xffffffffff"
        },{
            script:testScrit,
            block_number:"0xffff"
        }])
        expect(result).to.be.equal(null)

        // get scripts
        let result1 = await getScripts()
        expect(result1.length).to.be.equal(1)
        expect(result1[0].block_number).to.be.equal("0xffff")
        expect(result1[0].script.args).to.be.equal(testScrit.args)
        expect(result1[0].script.code_hash).to.be.equal(testScrit.code_hash)
        expect(result1[0].script.hash_type).to.be.equal(testScrit.hash_type)

    })

    it('set 特别多的script,should 返回null,get_scripts 能查询到set的所有scripts',async ()=>{
        //todo
        //返回null
        // get_scripts 能查询到set的所有scripts
        let scripts = new Set()
        let scriptsSet = new Set()

        for (let i = 150; i < 10000000; i++) {
           let scriptsTem = await getScriptsByBlockNum(BI.from(i))
            for (let j = 0; j < scriptsTem.length; j++) {
                if(scriptsSet.has(JSON.stringify(scriptsTem[j]))){
                    continue
                }
                scriptsSet.add(JSON.stringify(scriptsTem[j]))
                scripts.add(scriptsTem[j])
            }
            console.log('block num',i,'scripts length :',scripts.size)

            // @ts-ignore
            let temScriptsData = []
            let entryScript = scripts.entries()
            scripts.forEach(value => {
                temScriptsData.push({
                    script:value,
                    block_number:"0x1"
                })
            })

            if (temScriptsData.length > 0){
                // @ts-ignore
                await setScripts(temScriptsData)
                await getScripts()
            }
        }
    })




    describe('script', function () {
        describe('codeHash', function () {
            it("codeHash length not eq 64, return an error", async () => {
                try {
                    await setScripts([{
                        script: {
                            code_hash: "0x1234",
                            hash_type: "type",
                            args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                        }, block_number: "0xffff"
                    }])
                } catch (e) {
                    console.log('e:', e)
                    return
                }
                expect("").to.be.equal("failed")
            })
        });
        describe('hash_type', function () {
            it('hash_type not exist,should return error', async () => {
                try {
                    await setScripts([{
                        script: {
                            code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce1",
                            hash_type: "type1asdasd`🦚\"？?\\\"\"\\\"\"\"\\u0000？？？?\"\\\\\"{?}{:?}`asda",
                            args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                        }, block_number: "0xffff"
                    }])
                } catch (e) {
                    console.log('e:', e)
                    return
                }
                expect("").to.be.equal("failed")
            })

            it('hash_type is "",should return error ', async () => {
                try {
                    await setScripts([{
                        script: {
                            code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce1",
                            hash_type: "",
                            args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                        }, block_number: "0xfff"
                    }])
                } catch (e) {
                    console.log('e:', e)
                    return
                }
                expect("").to.be.equal("failed")


            })

            it('hash_type data ', async () => {

                await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hash_type: "data",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, block_number: "0xffff"
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
                    }, block_number: "0xffff"
                }])
                await getScripts()
            })

            it('hash_type type ', async () => {

                await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hash_type: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, block_number: "0xffff"
                }])
                await getScripts()
            })

            it('hash_type type is null ', async () => {

                try {
                    await setScripts([{
                        script: {
                            code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                            hash_type: undefined,
                            args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                        }, block_number: "0xffff"
                    }])
                }catch (e){
                    console.log(e)
                    return
                }
                expect("").to.be.equal("failed")
            })

        });
        describe('args', function () {
            it('arg is undefined,should return error msg',async ()=>{
                try {
                    await setScripts([{
                        script: {
                            code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                            hash_type: "type",
                            args: undefined
                        }, block_number: "0xffff"
                    }])
                }catch (e){
                    console.log(e)
                    return
                }
                expect("").to.be.equal("failed")
            })

            it('arg  is null,should return error msg ', async () => {
                try {
                    await setScripts([{
                        script: {
                            code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                            hash_type: "type",
                            args: null
                        }, block_number: "0xffff"
                    }])
                }catch (e){
                    console.log(e)
                    return
                }
                expect("").to.be.equal("failed")
            })

            it('arg is very large,should send success,return null',async ()=>{
                let argData = "0x";
                for (let i = 0; i < 100000; i++) {
                    argData = argData+"ffffff"
                }
                await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce2",
                        hash_type: "type",
                        args: argData
                    }, block_number: "0xffff"
                }])
                let result = await getScripts()
                expect(result[0].script.args).to.be.equal(argData)
            })

        });

        describe('block number', function () {
            it.skip('block number is overflow,should return failed msg', async () => {
                try {
                    await setScripts([{
                        script: {
                            code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                            hash_type: "type",
                            args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                        }, block_number: "0xffffffffffffffff"
                    }])
                } catch (e) {
                    return
                }
                expect("").to.be.equal("failed")

            });

            it('set 的script高度大于最新块高度,',async ()=>{

                //get latest height
                let tipMsg = await getTipHeader()
                console.log('tip msg :',tipMsg)
                // set script that height = latest height +2
                let setHeight = BI.from(tipMsg.number).add(2)
                let result= await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                        hash_type: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, block_number: setHeight.toHexString()
                }])
                expect(result).to.be.equal(null)
                // wait get_script.height update
                let sleepCount = 0
                while ( sleepCount < 8){
                    await Sleep(30*1000)
                    let result = await getScripts()
                    let current_update_block_number = result[0].block_number
                    expect(BI.from(current_update_block_number).sub(setHeight).toNumber()).to.be.gte(0)
                    console.log('current update block number:',current_update_block_number)
                    if(BI.from(current_update_block_number).sub(setHeight).gt(0)){
                        console.log('update succ')
                        return
                    }
                    sleepCount++
                }
                expect('').to.be.equal('time out ')

            })
            it('任意一个number,will update',async ()=>{
                //get latest height
                let tipMsg = await getTipHeader()

                // set script that height = latest height +2
                let setHeight = BI.from(tipMsg.number).div(2)
                let result= await setScripts([{
                    script: {
                        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                        hash_type: "type",
                        args: "0x2760d76d61cafcfc1a83d9d3d6b70c36fa9d4b1a"
                    }, block_number: setHeight.toHexString()
                }])
                expect(result).to.be.equal(null)

                // wait get_script.height update
                let sleepCount = 0
                while ( sleepCount < 8){
                    await Sleep(30*1000)
                    let result = await getScripts()
                    let current_update_block_number = result[0].block_number
                    expect(BI.from(current_update_block_number).sub(setHeight).toNumber()).to.be.gte(0)
                    console.log('current update block number:',current_update_block_number)
                    if(BI.from(current_update_block_number).sub(setHeight).gt(0)){
                        console.log('update succ')
                        return
                    }
                    sleepCount++
                }
                expect('').to.be.equal('time out ')
            })

        });

    });

});

async function Sleep(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}

async function getScriptsByBlockNum(blockNum:BI):Promise<Script[]>{
    let blockMsg = await rpcCLient.get_block_by_number(blockNum.toHexString())
    let scripts = []
    if (blockMsg == null || blockMsg.transactions == undefined){
        return []
    }
    for (let i = 0; i < blockMsg.transactions.length; i++) {
        let outputCell = blockMsg.transactions[i].outputs.pop()
        if (outputCell == undefined){
            continue
        }
        if (outputCell.type!= undefined){
            scripts.push(outputCell.type)
        }
        scripts.push(outputCell.lock)
    }
    return scripts
}
