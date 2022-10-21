import {ACCOUNT_PRIVATE, CKB_RPC_INDEX_URL, CkbClientNode, LightCli, rpcCLient} from "../../config/config";
import {generateAccountFromPrivateKey} from "../../service/transfer";
import {BI} from "@ckb-lumos/bi";
import {helpers} from "@ckb-lumos/lumos";
import {getCells, getCellsCapacity, getTipHeader, setScripts, waitScriptsUpdate} from "../../rpc";
import {expect} from "chai";

describe('transfer', function () {

    this.timeout(10000_000)
    it("demo",async ()=>{

        await CkbClientNode.clean()
        await CkbClientNode.start()
        // set script
        let account = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)

        await syncAccount(account.address,BI.from(1001).mul(10000000))
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
async function syncAccount(address: string, minBalance: BI) {
    //get set script msg

    let setScriptTem = helpers.parseAddress(address)
    // check account balance > bi
    let cap = await getCellsCapacity(setScriptTem,CKB_RPC_INDEX_URL)
    if (BI.from(cap.capacity).lt(minBalance)){
        throw Error("balance not enough")
    }

    // set script
    let cells = await getCells(setScriptTem,"lock",CKB_RPC_INDEX_URL)
    let minCellNumHex = cells.objects[0].block_number
    await setScripts([
        {script:setScriptTem,script_type:"lock",block_number:minCellNumHex}
    ])
    const tipHeader = await getTipHeader()
    //wait account update
    await waitScriptsUpdate(BI.from(tipHeader.number))
}

