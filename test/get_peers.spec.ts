import {request} from "../service";
import {CKB_LIGHT_RPC_URL} from "../config/config";
import {expect} from "chai";

describe('get_peers', function () {

    it("demo",async ()=>{
        const res = await request(1,CKB_LIGHT_RPC_URL,"get_peers",[])
        expect(res).to.be.equal("")
    })
});
