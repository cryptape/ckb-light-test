import {waitFetchTransactionStatusChange} from "../fetch_transaction.spec";
import {lightClientRPC, rpcCLient} from "../../config/config";
import {expect} from "chai";
import {FetchFlag} from "@ckb-lumos/light-client/lib/type";

describe('sdk:fetch_transaction', function () {

    this.timeout(10_000)
    it("not_found",async ()=>{
        const hash = randomHash()
        await waitFetchTransactionStatusChange(hash,"not_found", 100)
    })
    it("fetch tx",async ()=>{
        const block0Tx1 = (await rpcCLient.getBlockByNumber("0x0")).transactions[0]
        const txMsg = await lightClientRPC.fetchTransaction(block0Tx1.hash)
        const txMsgForRpc = await rpcCLient.getTransaction(block0Tx1.hash)
        expect(txMsg.status).to.be.equal(FetchFlag.Fetched)
        if(txMsg.status == FetchFlag.Fetched){
            expect(txMsg.data.transaction).to.be.deep.equal(txMsgForRpc.transaction)

            //todo wait lumos upgrade ,can skip ts ignore
            // @ts-ignore
            expect(txMsgForRpc.txStatus).to.be.deep.equal(txMsg.data.txStatus)
        }
    })

});



function randomHash() {
    let length = "b123a1a3199a3d7a5dc4dc25feec4925cfa0edb14260e1f6b50e55ab862d0e5c".length
    let str = '0123456789abcdef';
    let result = '';
    for (let i = length; i > 0; --i)
        result += str[Math.floor(Math.random() * str.length)];
    return "0x" + result;
}
