import {LightClientRPC} from "@ckb-lumos/light-client";
import {CKB_DEV_RPC_URL} from "../../config/config";
import {utils} from "@ckb-lumos/base";
import {request} from "../../service";

describe('ddd', function () {

    this.timeout(2000000)
    it("saada",async ()=>{
        const lightClientRPC =  new LightClientRPC("http://localhost:9000")
        let tip = await lightClientRPC.getTipHeader();

    })

});

async function getBlockByNumber(number:string) {
    return utils.deepCamel(request(1,CKB_DEV_RPC_URL,"get_block_by_number",[number,"0x0",true]))
}
