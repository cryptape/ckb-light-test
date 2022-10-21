import {getTransactions} from "../rpc";

describe('get_transactions', function () {

    it("demo",async ()=>{

        let response = await getTransactions({
                "script": {
                    "code_hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "hash_type": "data",
                    "args": "0x"
                },
                "script_type": "lock",
                "group_by_transaction": true
            }
        )
        console.log("response:",response)
    })

});
