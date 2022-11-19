import {getCells, getScripts, getTipHeader, getTransaction, ScriptMsg, setScripts, waitScriptsUpdate} from "../rpc";
import {expect} from "chai";
import {
    ACCOUNT_PRIVATE,
    CKB_RPC_INDEX_URL,
    CKB_RPC_URL,
    rpcCLient
} from "../config/config";
import {BI} from "@ckb-lumos/lumos";
import {generateAccountFromPrivateKey} from "../service/transfer";
import {Transaction} from "@ckb-lumos/base/lib/api";
import {Sleep} from "../service/util";

describe('get_transaction', function () {

    this.timeout(600_000)
    it('txHash does not conform to hash rules', async () => {
        try {
            await getTransaction("0x3a46167541123530ac8100841d4e014028c60af18305e5594452d0b8aa65b1")
        } catch (e) {
            console.log(e)
            return
        }
        expect("").to.be.equal("failed")
    })
    it('query txHash that not in filter', async () => {
        // get header
        let header = await getTipHeader(CKB_RPC_URL)

        //get txHash
        let txs = await rpcCLient.get_block_by_number(header.number)
        console.log('txs:', txs)
        if (txs == undefined) {
            expect("").to.be.equal("get_block_by_number failed ")
            return
        }
        if (txs.transactions.length == 0) {
            console.log('txs.transactions.length==0')
            return
        }
        let txHash = txs.transactions[0].hash
        if (txHash == undefined) {
            expect("").to.be.equal("txHash == undefined")
            return
        }
        //
        let response = await getTransaction(txHash)
        expect(response).to.be.equal(null)
    })

    it('query the txHash that contains collect lock cells,should return hash message', async () => {

        let script = generateAccountFromPrivateKey(ACCOUNT_PRIVATE).lockScript

        // get cells
        let cells = await getCells(script, "lock", CKB_RPC_INDEX_URL)
        if (cells.objects.length == 0) {
            console.log('cells.objects.length==0')
            return
        }

        // @ts-ignore
        await setScripts([{script: script, script_type:"lock",block_number: BI.from(cells.objects[0].block_number).sub(1).toHexString()}])
        let collect_cells_length = 0
        await waitScriptsUpdate(BI.from(cells.objects[0].block_number).add(100))
        let lightCells = await getCells(script)
        //get hash by cells
        // @ts-ignore
        let lightTransaction = await getTransaction(lightCells.objects[0].out_point.tx_hash)
        // @ts-ignore
        let ckbTransaction = await getTransaction(lightCells.objects[0].out_point.tx_hash, CKB_RPC_URL)
        expect(JSON.stringify(lightTransaction.transactions)).to.be.equal(JSON.stringify(ckbTransaction.transactions))
    })

    describe('consumer tx', function () {
        //todo
        let outPutTxs: string[]
        let inputTxs: string[]
        let scripts: ScriptMsg[]
        let consumerTx: Transaction
        before(async () => {
            outPutTxs = []
            inputTxs = []
            scripts = []
            let consumerBlockNumHex: string

            // find tx that input.length > 0
            let tipHeader = await getTipHeader()
            //todo replace 6696653 => tipHeader.number
            for (let i = BI.from(tipHeader.number).sub(300).toNumber(); i > 0; i--) {
                let tipHeader = await rpcCLient.get_block_by_number(BI.from(i).toHexString())
                for (let k = 1; k < tipHeader.transactions.length; k++) {
                    if (tipHeader.transactions[k].inputs.length == 0) {
                        continue
                    }
                    console.log("current block num:", i, " tx idx :", k, " input length :" + tipHeader.transactions[k].inputs.length)

                    if (tipHeader.transactions[k].inputs.length > 0) {

                        consumerTx = tipHeader.transactions[k]
                        consumerBlockNumHex = BI.from(i).toHexString()
                        break
                    }
                }
                if (consumerTx != undefined) {
                    break
                }
            }
            expect(consumerTx).to.be.not.equal(undefined)

            // get scripts by  tx hash inputs

            for (let i = 0; i < consumerTx.inputs.length; i++) {
                let txInfo = await rpcCLient.get_transaction(consumerTx.inputs[i].previous_output.tx_hash)
                let blockMsg = await rpcCLient.get_block(txInfo.tx_status.block_hash)
                //set script : tx.input 'script
                if (scripts.some(script=>JSON.stringify(script.script) == JSON.stringify(txInfo.transaction.outputs[BI.from(consumerTx.inputs[i].previous_output.index).toNumber()].lock))){
                    // provider not exist same script
                    continue
                }
                scripts.push({
                    script: txInfo.transaction.outputs[BI.from(consumerTx.inputs[i].previous_output.index).toNumber()].lock,
                    script_type:"lock",
                    block_number: BI.from(blockMsg.header.number).sub(10).toHexString()
                })

                outPutTxs.push(consumerTx.inputs[i].previous_output.tx_hash)
            }
            inputTxs.push(consumerTx.hash)

            for (let i = 0; i < scripts.length; i++) {
                console.log(' set consumer input  idx:', i, ' script:', JSON.stringify(scripts[i]), ', consumer tx:', consumerTx.inputs[i].previous_output.tx_hash)
            }

            //set consumer script
            await setScripts(scripts)

            // wait light client update to tipHeader
            await waitScriptsUpdate(BI.from(tipHeader.number).sub(300))

            // wait 60s
            await Sleep(60 * 1000)
        })
        it('query tx that script is consumer used output', async () => {


            let response = (await Promise.all(outPutTxs.map((hash) => {
                console.log('hash:', hash)
                return getTransaction(hash)
            }, console.log)))
            response.forEach((ret) => {
                console.log("hash:", ret)
                expect(ret).to.be.not.equal(null);
            })

        })
        it('query tx that script is consumer used input', async () => {

            let scriptsList = await getScripts()

            let resultList = scriptsList.map(
                (script) => {
                    return JSON.stringify(script.script)
                }).filter(item => {
                return consumerTx.outputs.map(output => {
                    return JSON.stringify(output.lock)
                }).some(data => item == data)
            })
            if (resultList.length > 0) {
                console.log('contains script:', resultList)
                let result = await getTransaction(consumerTx.hash)
                expect(result).to.be.not.equal(null)
                return
            }

            let response = await Promise.all(inputTxs.map((hash) => {
                console.log('used  output in generate hash:', hash)
                return getTransaction(hash)
            }, console.log))

            response.forEach((hash) => {
                console.log(hash)
                expect(hash).to.be.equal(null);
            })

        })

    });

});
