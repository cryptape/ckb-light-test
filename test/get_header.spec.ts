import {getCells, getHeader, getTipHeader, setScripts, waitScriptsUpdate} from "../rpc";
import {expect} from "chai";
import {ACCOUNT_PRIVATE, CKB_RPC_INDEX_URL, rpcCLient} from "../config/config";
import {BI} from "@ckb-lumos/lumos";
import {generateAccountFromPrivateKey} from "../service/transfer";


describe('get_header', function () {

    this.timeout(600000)

    it("query the hash that does not exist on the ckb chain,should return null", async () => {
        let response = await getHeader("0x1d7c6f92fa3335bf01c3f43f8970cb586d2dee81b90d363169dbe1bba98d6c11")
        console.log('response:', response)
        expect(response).to.be.equal(null)
    })
    it('query the collected hash,should return block msg', async () => {

        let script = generateAccountFromPrivateKey(ACCOUNT_PRIVATE).lockScript
        let cells = await getCells(script, "lock", CKB_RPC_INDEX_URL)

        // set scripts :( account,cells[0].height -1 ) ,want to collected cells that not used ;
        await setScripts([{script: script,script_type:"lock", block_number: BI.from(cells.objects[0].block_number).sub(1).toHexString()}])

        // wait update height > cells[0].block_number
        await waitScriptsUpdate(BI.from(cells.objects[0].block_number))

        // get collect  cells hash
        let response = await getCells(script)

        // @ts-ignore
        let block = await rpcCLient.get_block_by_number(response.objects[0].block_number.toString())
        if (block == undefined) {
            return
        }
        // get header from ckb light client
        let header = await getHeader(block.header.hash)
        expect(JSON.stringify(header)).to.be.equal(JSON.stringify(block.header))

    })

    it("query hashes that have not been collected,should return null", async () => {
        let response = await getTipHeader()
        let header = await getHeader(response.hash)
        expect(header).to.be.equal(null)
    })

    it('query data that does not conform to the hash specification,should return error', async () => {
        try {
            await getHeader("0xb")
        } catch (e) {
            console.log(e)
            return
        }
        expect("").to.be.equal("failed")
    })
});
