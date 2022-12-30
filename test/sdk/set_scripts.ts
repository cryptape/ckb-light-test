import {ACCOUNT_PRIVATE, lightClientRPC} from "../../config/config";
import {generateAccountFromPrivateKey} from "../../service/transfer";
import {expect} from "chai";

describe('sdk set_scripts', function () {


    it("demo",async ()=>{

        let res = await lightClientRPC.setScripts([{
            script:generateAccountFromPrivateKey(ACCOUNT_PRIVATE).lockScript,
            scriptType:"lock",
            blockNumber:"0x0"
        }])
        console.log("res:",res)
        expect(res).to.be.null
    })

});
