import {CkbClientNode, lightClientRPC, MINER_SCRIPT} from "../config/config";
import {expect} from "chai";
import {Sleep} from "../service/util";
import {BI} from "@ckb-lumos/lumos";

describe('get_scripts', function () {


    this.timeout(100000)
    before(async ()=>{

       await lightClientRPC.setScripts([])

    })
    it('no scripts', async() =>{
        let result = await lightClientRPC.getScripts()
        expect(result.toString()).to.be.equal("")

    });

    it('restart node ,get script result not mod,cells do not abandon',async ()=>{
        // set script
        await lightClientRPC.setScripts([{script:MINER_SCRIPT,scriptType:"lock",blockNumber:"0x1"}])
        let result = await lightClientRPC.getScripts()
        expect(result.length).to.be.equal(1)

        // ckb node restart
        let beforeCells = await lightClientRPC.getCells({
            script:MINER_SCRIPT,scriptType:"lock"
        },"asc","0xfff")
        console.log('cells :',beforeCells)
        await CkbClientNode.stop()
        await CkbClientNode.start()

        // get script
        let resultAfterStart = await lightClientRPC.getScripts()
        expect(resultAfterStart.length).to.be.equal(1)
        let afterCells = await lightClientRPC.getCells({
            script:MINER_SCRIPT,scriptType:"lock"
        },"asc","0xfff")
        expect(afterCells.objects.length).to.be.gte(beforeCells.objects.length)

    })
    it("Interval query script, the height keeps increasing",async ()=>{
        await lightClientRPC.setScripts([{script:MINER_SCRIPT,scriptType:"lock",blockNumber:"0x1"}])
        await Sleep(30000)
        let scripts = await lightClientRPC.getScripts()
        expect(BI.from(scripts[0].blockNumber).toNumber()).to.be.gt(1)
    })

    it.skip('The results of the query will be out of order',async ()=>{
        //todo
    })

});
