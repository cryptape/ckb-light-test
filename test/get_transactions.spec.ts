import {lightClientRPC} from "../config/config";

describe('get_transactions', function () {

    it("demo",async ()=>{

        let response = await lightClientRPC.getTransactions(
            {
                "script": {
                    "codeHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "hashType": "data",
                    "args": "0x"
                },
                "scriptType": "lock",
                "groupByTransaction": true
            },"asc","0xfff"
        )
        console.log("response:",response)
    })

});
