import {getCells, getScripts, setScripts} from "../rpc";
import {CkbClientNode, MINER_SCRIPT} from "../config/config";
import {expect} from "chai";
import {Sleep} from "../service/util";
import {BI} from "@ckb-lumos/lumos";

describe('get_scripts', function () {


    this.timeout(100000)
    before(async ()=>{

       await setScripts([])

    })
    it('no scripts', async() =>{
        let result = await getScripts()
        expect(result.toString()).to.be.equal("")

    });

    it('restart node ,get script result not mod,cells do not abandon',async ()=>{
        // set script
        await setScripts([{script:MINER_SCRIPT,block_number:"0x1"}])
        let result = await getScripts()
        expect(result.length).to.be.equal(1)

        // ckb node restart
        let beforeCells = await getCells(MINER_SCRIPT)
        console.log('cells :',beforeCells)
        await CkbClientNode.stop()
        await CkbClientNode.start()

        // get script
        let resultAfterStart = await getScripts()
        expect(resultAfterStart.length).to.be.equal(1)
        let afterCells = await getCells(MINER_SCRIPT)
        expect(afterCells.objects.length).to.be.gte(beforeCells.objects.length)

    })
    it("Interval query script, the height keeps increasing",async ()=>{
        await setScripts([{script:MINER_SCRIPT,block_number:"0x1"}])
        await Sleep(30000)
        let scripts = await getScripts()
        expect(BI.from(scripts[0].block_number).toNumber()).to.be.gt(1)
    })

    it.skip('The results of the query will be out of order',async ()=>{
        //todo
    })

});
