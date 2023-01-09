import {CkbClientNode, MINER_SCRIPT3} from "../config/config";
import {LightClientScript} from "@ckb-lumos/light-client/src/type";
import {getCellsCapacityRequest, waitScriptsUpdate} from "../service/lightService";
import {BI} from "@ckb-lumos/lumos";
import {Sleep} from "../service/util";
import {setScriptWithCommand} from "./set_script_with_command.spec";
import {expect} from "chai";

describe('set_script_with_remove', function () {

    this.timeout(1000_000)

    it("clean script , getCellsCapacityRequest return cap not inc", async () => {

        await CkbClientNode.clean()
        await CkbClientNode.start()
        await CkbClientNode.status()

        const testScript = MINER_SCRIPT3;
        const minerScript: LightClientScript[] = [
            {
                script: testScript,
                scriptType: "lock",
                blockNumber: "0x0"
            }
        ]
        await setScriptWithCommand(minerScript, "all")
        await waitScriptsUpdate(BI.from("1000"))
        let scriptCap = await getCellsCapacityRequest({
            script: testScript,
            scriptType: "lock"
        })
        let afterCap;
        for (let i = 0; i < 5; i++) {
            afterCap = await getCellsCapacityRequest({
                script: testScript,
                scriptType: "lock"
            })
            await Sleep(1000)
        }
        expect(afterCap.capacity).to.be.not.equal(scriptCap.capacity)
        await setScriptWithCommand([], "all")

        // 2. check balance of miner account
        let beforeCap = await getCellsCapacityRequest({
            script: testScript,
            scriptType: "lock"
        })
        for (let i = 0; i < 20; i++) {
            let accountCap = await getCellsCapacityRequest({
                script: testScript,
                scriptType: "lock"
            })
            await Sleep(1000)
            expect(beforeCap.capacity).to.be.equal(accountCap.capacity)
        }
    })
});
