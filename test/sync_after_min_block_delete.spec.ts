import {CKB_LIGHT_RPC_URL, lightClientRPC, rpcCLient} from "../config/config";
import {getLightSyncHeight, setScriptWithCommand, waitScriptsUpdateWithTime} from "../service/lightService";
import {BI} from "@ckb-lumos/bi";
import {helpers} from "@ckb-lumos/lumos";

describe('sync after min block delete', function () {

    this.timeout(1000000)
    before(async () => {

        await lightClientRPC.setScripts([])

    })
    after(async () => {
        await lightClientRPC.setScripts([])
    })

    it('sync after min block delete', async () => {

        let syncHeightBlockAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2t8syzsvtyt8hkc68d7hkpjwy4u6nwjjg08lwpz"
        let syncLowHeightBLockAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgj8re09l7gk267ank62hadpp3t2kp20kqnud0jc"
        // add height block : 10000000
        await setScriptWithCommand(CKB_LIGHT_RPC_URL, [{
            script: helpers.addressToScript(syncHeightBlockAddress),
            scriptType: "lock",
            blockNumber: BI.from("10000000").toHexString()
        }], "all")
        // wait height block sync
        await waitScriptsUpdateWithTime(BI.from(10000100), CKB_LIGHT_RPC_URL, 120)
        // add low block :10000
        await setScriptWithCommand(CKB_LIGHT_RPC_URL, [{
            script: helpers.addressToScript(syncLowHeightBLockAddress),
            scriptType: "lock",
            blockNumber: BI.from("10000").toHexString()
        }], "partial")

        console.log("wait low block sync 11000")
        // wait low block sync
        await waitScriptsUpdateWithTime(BI.from(11000), CKB_LIGHT_RPC_URL, 120)
        // remove low block
        await setScriptWithCommand(CKB_LIGHT_RPC_URL, [{
            script: helpers.addressToScript(syncLowHeightBLockAddress),
            scriptType: "lock",
            blockNumber: BI.from("10000").toHexString()
        }], "delete")

        //should empty
        // log contains match ，but query result is empty, so remove it
        // console.log(`query not match header:`, header)

        // wait height block sync
        let height = await getLightSyncHeight(CKB_LIGHT_RPC_URL)
        console.log("wait height sync :", height.add(1000).toNumber())
        await waitScriptsUpdateWithTime(height.add(1000), CKB_LIGHT_RPC_URL, 60)

    })

});