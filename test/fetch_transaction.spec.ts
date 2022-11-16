import {ACCOUNT_PRIVATE, CKB_RPC_URL, rpcCLient} from "../config/config";
import {BI} from "@ckb-lumos/bi";
import { fetch_transaction} from "../rpc";
import {expect} from "chai";
import {Sleep} from "../service/util";
import {generateAccountFromPrivateKey, transfer} from "../service/transfer";
import {getTransactionWaitCommit} from "../service/txService";

describe('fetch_transaction', function () {

    this.timeout(100_10000)

    it("genesis  hash",async ()=>{
        //https://pudge.explorer.nervos.org/transaction/0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f
        let transaction = await fetch_transaction("0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f")
        console.log("tx:",transaction)
        expect(transaction.status).to.be.equal("fetched")
    })
    it("exist hash",async ()=>{
        let block = await rpcCLient.get_block_by_number("0x1")
        for (let i = 0; i < block.transactions.length; i++) {
            let tx =  block.transactions[i].hash
            let response = await waitFetchedHeaderStatusChange(tx,"fetched",100)
            expect(response.status).to.be.equal("fetched")
        }
    })

    it("not exist hash",async ()=>{
        await waitFetchedHeaderStatusChange("0xfa0072347417d8f9cd328ad52ed71f993abff8923ee19cd50fc56782c7aedc41","not_found",100)
    })
    it("send hash ,should return fetched ", async ()=> {
        let account = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)
        let tx = await transfer({
            from: account.address,
            to: account.address,
            amount:BI.from(501).toHexString(),
            privKey:ACCOUNT_PRIVATE,
        })
        await waitFetchedHeaderStatusChange(tx,"fetched",10000)
    });
    it("ddd",async ()=>{
        await getTransactionWaitCommit("0x6660ed8ec877ede4add1d44202de1fbcda053c902edd0b37568fcb9fb0e7b890",CKB_RPC_URL,1000)
    })
});


async function waitFetchedHeaderStatusChange(hash: string, status: "added" | "fetching" | "fetched" | "not_found", tryCount: number) {
    for (let i = 0; i < tryCount; i++) {
        let response = await fetch_transaction(hash)
        if (response.status == status) {
            return response
        }
        await Sleep(1000)
    }
    throw Error("[waitFetchedHeaderStatusChange] time out ")
}

