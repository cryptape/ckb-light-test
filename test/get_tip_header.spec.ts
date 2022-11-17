import {getHeader, getTipHeader} from "../rpc";
import {CKB_LIGHT_RPC_URL, CKB_RPC_URL} from "../config/config";
import * as assert from "assert";


describe('get_tip_header', function () {
    this.timeout(10000)
    it('light node getTipHeader,should result in ckb',async()=>{
        let lightRes = await getTipHeader(CKB_LIGHT_RPC_URL)
        let indexRes = await getHeader(lightRes.hash,CKB_RPC_URL)
        assert.deepEqual(lightRes,indexRes,"light query result not eq ckb rpc query result")
    })

});
