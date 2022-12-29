import {lightClientRPC} from "../../config/config";
import {expect} from "chai";

describe('sdk get_header', function () {
    it("demo",async ()=>{
        let genesisBlock = await lightClientRPC.getGenesisBlock();
        let genesisHeader = await lightClientRPC.getHeader(genesisBlock.header.hash)
        expect(genesisHeader).to.be.deep.equal(genesisBlock.header)
    })


});
