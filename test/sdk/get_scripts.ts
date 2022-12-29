import {ACCOUNT_PRIVATE, lightClientRPC} from "../../config/config";
import {expect} from "chai";
import {generateAccountFromPrivateKey} from "../../service/transfer";
import {LightClientScript} from "@ckb-lumos/light-client/lib/type";

describe('sdk get_scripts', function () {

    //hashType "type" | "data" | "data1"
    it("demo",async ()=>{
        let set_data:LightClientScript={
            script:generateAccountFromPrivateKey(ACCOUNT_PRIVATE).lockScript,
            scriptType:"lock",
            blockNumber:"0x0"
        }
        let set_res = await lightClientRPC.setScripts([set_data])
        console.log("res:",set_res)
        expect(set_res).to.be.null

        let get_res = await lightClientRPC.getScripts();
        expect(get_res[0].scriptType).to.be.equal(set_data.scriptType)
        expect(get_res[0].script.hashType).to.be.equal(set_data.script.hashType)
        expect(get_res[0].script.codeHash).to.be.equal(set_data.script.codeHash)
        expect(get_res[0].script.args).to.be.equal(set_data.script.args)
        expect(get_res[0].blockNumber).to.be.equal(set_data.blockNumber)

    })

});
