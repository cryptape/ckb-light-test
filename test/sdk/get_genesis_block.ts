import {lightClientRPC, rpcCLient} from "../../config/config";
import {expect} from "chai";

describe('get_genesis_block', function () {
    this.timeout(1000_000)
    it("demo",async ()=>{
        let resLight = await lightClientRPC.getGenesisBlock()
        let resRpc = await rpcCLient.getBlockByNumber("0x0")
        expect(resLight).to.be.deep.equal(resRpc)
    })


});
