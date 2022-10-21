import {fetch_header, getTipHeader, waitScriptsUpdate} from "../rpc";
import {CkbClientNode, rpcCLient} from "../config/config";
import {expect} from "chai";
import {Sleep} from "../service/util";
import {BI} from "@ckb-lumos/bi";

describe('fetch_header', function () {

    this.timeout(1000_10000)

    it("genesis hash,should return fetched", async () => {
        // https://pudge.explorer.nervos.org/block/0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606
        const res = await fetch_header("0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606")
        expect(res.status).to.be.equal("fetched")
    })



    it("exist hash,first fetched ,should status wil return  fetched", async () => {
        let blockHash = await getHeaderHashByBlockNumber("0x1011")
        let firstFetchedData = await waitFetchedHeaderStatusChange(blockHash,"fetched",100)
        expect(firstFetchedData.status).to.be.equal("fetched")
    })

    it("fetch height > tip_header",async ()=>{
        let tip_header = await rpcCLient.get_tip_header()
        await fetch_header(tip_header.hash)
        await waitScriptsUpdate(BI.from(tip_header.number))
        await waitFetchedHeaderStatusChange(tip_header.hash,"fetched",1000)
    })

    it("get script ",async ()=>{
    })


    it("fetch not exist hash,should return not found ", async () => {
        function randomHash() {
            let length = "b123a1a3199a3d7a5dc4dc25feec4925cfa0edb14260e1f6b50e55ab862d0e5c".length
            let str = '0123456789abcdef';
            let result = '';
            for (let i = length; i > 0; --i)
                result += str[Math.floor(Math.random() * str.length)];
            return "0x" + result;
        }
        let random_hash = randomHash()
        let res = await waitFetchedHeaderStatusChange(random_hash, "not_found", 100)
        expect(res.status).to.be.equal("not_found")
    })

});

async function getHeaderHashByBlockNumber(blockNum: string) {
    let blockMsg = await rpcCLient.get_block_by_number(blockNum)
    return blockMsg.header.hash
}


async function waitFetchedHeaderStatusChange(hash: string, status: "added" | "fetching" | "fetched" | "not_found", tryCount: number) {
    for (let i = 0; i < tryCount; i++) {
        let response = await fetch_header(hash)
        if (response.status == status) {
            return response
        }
        await Sleep(1000)
    }
    throw Error("[waitFetchedHeaderStatusChange] time out ")
}
