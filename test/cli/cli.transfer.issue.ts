import {ACCOUNT_PRIVATE, CkbClientNode, LightCli, rpcCLient} from "../../config/config";
import {generateAccountFromPrivateKey} from "../../service/transfer";
import {BI} from "@ckb-lumos/bi";
import {expect} from "chai";
import {syncAccountBalanceByCells} from "./cli.spec";

describe('transfer', function () {

    this.timeout(10000_000)

    it("demo",async ()=>{

        await CkbClientNode.clean()
        await CkbClientNode.start()
        // set script
        let account = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)

        await syncAccountBalanceByCells(account.address,BI.from(1001).mul(10000000))
        let to = account.address
        let cap = "100.1"
        let response = await LightCli.cli(" transfer "+
            " --from-key "+ ACCOUNT_PRIVATE+
            " --to-address "+ to+
            " --capacity "+ cap)
        expect(response.stdout).to.be.include("tx sent")
        console.log("")

    })
});
