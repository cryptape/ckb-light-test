import {lightClientRPC, rpcCLient} from "../config/config";
import {expect} from "chai";
import {Sleep} from "../service/util";
import {FetchFlag} from "@ckb-lumos/light-client/lib/type";

describe('fetch_transaction', function () {

    this.timeout(100_10000)

    it("genesis  hash",async ()=>{
        //https://pudge.explorer.nervos.org/transaction/0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f
        let transaction = await lightClientRPC.fetchTransaction("0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f")
        let ckbResult = await rpcCLient.getTransaction("0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f")
        expect(transaction.status).to.be.equal(FetchFlag.Fetched)
        if(transaction.status == FetchFlag.Fetched){
            expect(transaction.data.transaction.hash).to.be.equal(ckbResult.transaction.hash)
            expect(JSON.stringify(transaction.data.transaction.outputsData)).to.be.equal(JSON.stringify(ckbResult.transaction.outputsData))
        }

    })

    it("exist hash",async ()=>{
        let block = await rpcCLient.getBlockByNumber("0x1")
        for (let i = 0; i < block.transactions.length; i++) {
            let tx =  block.transactions[i].hash
            let response = await waitFetchTransactionStatusChange(tx,"fetched",100)
            expect(response.status).to.be.equal("fetched")
        }
    })

    it("not exist hash",async ()=>{
        await waitFetchTransactionStatusChange("0xfa0072347417d8f9cd328ad52ed71f993abff8923ee19cd50fc56782c7aedc41","not_found",100)
    })
    // it("send hash ,should return fetched ", async ()=> {
    //     let account = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)
    //     let tx = await transfer({
    //         from: account.address,
    //         to: account.address,
    //         amount:BI.from(501).toHexString(),
    //         privKey:ACCOUNT_PRIVATE,
    //     })
    //     await waitFetchedHeaderStatusChange(tx,"fetched",10000)
    // });
});


export async function waitFetchTransactionStatusChange(hash: string, status: "added" | "fetching" | "fetched" | "not_found", tryCount: number) {
    for (let i = 0; i < tryCount; i++) {
        let response = await lightClientRPC.fetchTransaction(hash)
        if (response.status == status) {
            return response
        }
        await Sleep(1000)
    }
    throw Error("[waitFetchedHeaderStatusChange] time out ")
}

