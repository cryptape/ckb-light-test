import { lightClientRPC, rpcCLient} from "../config/config";
import * as assert from "assert";


describe('get_tip_header', function () {
    this.timeout(10000)
    it('light node getTipHeader,should result in ckb',async()=>{
        let lightRes = await lightClientRPC.getTipHeader()
        let indexRes = await rpcCLient.getHeader(lightRes.hash)
        assert.deepEqual(lightRes,indexRes,"light query result not eq ckb rpc query result")
    })

});
