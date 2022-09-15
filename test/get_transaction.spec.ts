import {getCells, getScripts, getTipHeader, getTransaction, ScriptMsg, setScripts, waitScriptsUpdate} from "../rpc";
import {expect} from "chai";
import {
    ACCOUNT_PRIVATE,
    CKB_RPC_INDEX_URL,
    CKB_RPC_URL,
    CkbClientNode,
    MINER_SCRIPT,
    rpcCLient
} from "../config/config";
import {BI} from "@ckb-lumos/lumos";
import {generateAccountFromPrivateKey} from "../service/transfer";
import {Output, Transaction} from "@ckb-lumos/base/lib/api";
import {Hash, HexNumber} from "@ckb-lumos/base/lib/primitive";
import {Block, CellWithStatus} from "@ckb-lumos/base";
import {Sleep} from "../service/util";

describe('get_transaction', function () {

    this.timeout(1000000)
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
        await setScripts([{script: script, block_number: BI.from(cells.objects[0].block_number).sub(1).toHexString()}])
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

    it("query txHash that output consumer",async ()=>{

        await CkbClientNode.clean()
        await CkbClientNode.start()
        //6696653
        let consumerTx:Transaction

        let consumerBlockNumHex:string
        // collect consumer tx
        let tipHeader = await getTipHeader()

        //todo replace 6696653 => tipHeader.number
        for (let i = BI.from(6696653).toNumber(); i > 0; i--) {
            let tipHeader = await rpcCLient.get_block_by_number(BI.from(i).toHexString())
            for (let k = 1; k < tipHeader.transactions.length; k++) {
                if (tipHeader.transactions[k].inputs.length == 0){
                    continue
                }
                console.log("current block num:",i," tx idx :",k," input length :"+tipHeader.transactions[k].inputs.length)
                if(tipHeader.transactions[k].inputs.length>0){
                    consumerTx = tipHeader.transactions[k]
                    consumerBlockNumHex = BI.from(i).toHexString()
                    break
                }
            }
            if (consumerTx != undefined){
                break
            }
        }
        expect(consumerTx).to.be.not.equal(undefined)



        // get scripts by collect consumer txhash inputs
        let scripts: ScriptMsg[] = []
        for (let i = 0; i < consumerTx.inputs.length; i++) {
            console.log('deal script',i)
            let txInfo = await rpcCLient.get_transaction(consumerTx.inputs[i].previous_output.tx_hash)
            let blockMsg = await rpcCLient.get_block(txInfo.tx_status.block_hash)
            scripts.push({
                script:txInfo.transaction.outputs[BI.from(consumerTx.inputs[i].previous_output.index).toNumber()].lock,
                block_number:BI.from(blockMsg.header.number).sub(1).toHexString()
            })
        }
        for (let i = 0; i < scripts.length; i++) {
            console.log(' set consumer input  idx:',i,' script:',JSON.stringify(scripts[i]),', consumer tx:',consumerTx.inputs[i].previous_output.tx_hash)
        }

        //set consumer script
        await setScripts(scripts)

        // wait light node update to tipHeader
        await waitScriptsUpdate(BI.from(tipHeader.number))

        // wait 100s
        await Sleep(100*1000)

        let currentScripts = await getScripts()
        console.log('current filter block num:',currentScripts[0].block_number,' consumer block number:',consumerBlockNumHex)
        console.log('------------ query consumer\' cells -----------')
        // query consumer cells
        for (let i = 0; i < scripts.length; i++) {
            let cells = await getCells(scripts[i].script)
            console.log('cells:',cells)
            let notLivedCellNum = 0
            for (let j = 0; j < cells.objects.length; j++) {
                // check get_cells  is lived ?
                let status = await rpcCLient.get_live_cell({
                    tx_hash:cells.objects[j].out_point.tx_hash,
                    index:cells.objects[j].out_point.index
                },false)
                if (status.status != "live"){
                    notLivedCellNum++
                    console.log('status not lived,txHash:',cells.objects[j].out_point.tx_hash, ' idx:',cells.objects[j].out_point.index)
                }
                if (notLivedCellNum>5){
                    console.log('not lived cells > 5')
                    //todo test case failed ?
                    break
                }
            }
        }


        console.log('--------query tx --------')
        // query consumer tx ,should return null ?
        for (let i = 0; i < consumerTx.inputs.length; i++) {
            let result = await getTransaction(consumerTx.inputs[i].previous_output.tx_hash)
            console.log('result :',result)
        }

    })

});
