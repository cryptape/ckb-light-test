import {getGenesisBlock, getHeader} from "../rpc";
import {CKB_RPC_URL} from "../config/config";
import {expect} from "chai";

describe('get_genesis_block', function () {

    this.timeout(100_000)
    it('[],should return not null',async ()=>{
        let response = await getGenesisBlock()
        let res1 = await getHeader("0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606",CKB_RPC_URL)
        expect(JSON.stringify(response.header)).to.be.equals(JSON.stringify(res1))
    })
});
