import {request} from "../service";
import {CKB_LIGHT_RPC_URL} from "../config/config";
import {expect} from "chai";

describe('local_node_info', function () {
    it("demo",async ()=>{
        const res = await request(1,CKB_LIGHT_RPC_URL,"local_node_info",[])
        expect(res.active).to.be.equal(true)

    })
});

