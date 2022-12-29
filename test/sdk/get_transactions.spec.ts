import { lightClientRPC} from "../../config/config";
import {GetTransactionsSearchKey} from "@ckb-lumos/ckb-indexer/lib/type";

describe('sdk get_transactions', function () {

    this.timeout(1000_000)
    it("demo",async ()=>{

        let genesisBlock = await lightClientRPC.getGenesisBlock();
        const genesisSearch:GetTransactionsSearchKey = {
            scriptType: "lock",
            groupByTransaction:true,
            script:genesisBlock.transactions[1].outputs[1].lock,
            filter:{

            }
        }

        let res = await lightClientRPC.getTransactions( genesisSearch,"asc","0x1")
        console.log("----")
        console.log(res.objects[0].transaction)
        console.log("res:",res.objects[0]["transaction"])
    })

});
