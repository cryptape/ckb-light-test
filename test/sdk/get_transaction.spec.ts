import {CKB_LIGHT_RPC_URL, CKB_RPC_URL, lightClientRPC, rpcCLient} from "../../config/config";
import {expect} from "chai";
import {getTransaction} from "../../service/lightService";

describe('sdk get_transaction', function () {

    this.timeout(1000*1000)
    it("demo",async ()=>{
        const genesisBlock = await lightClientRPC.getGenesisBlock()
        let genesisTx = await lightClientRPC.getTransaction(genesisBlock.transactions[0].hash)
        let rpcTx = await rpcCLient.getTransaction(genesisBlock.transactions[0].hash)
        expect(genesisTx).to.be.deep.equal(rpcTx)
        // todo wait lumos upgrade , skip @ts-ignore
        // @ts-ignore
        expect(rpcTx.txStatus).to.be.deep.equal(genesisTx.txStatus)

    })
    it("not exist tx",async ()=>{
       let response =  await getTransaction("0x1be494190c1173bc7058dfeb9aa2420ac0a91df5634321298079e7f3765011f9",CKB_LIGHT_RPC_URL)
        console.log("res:",response)

    })

});
