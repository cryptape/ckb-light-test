import {getCellsRequest} from "../../rpc";
import {CKB_RPC_INDEX_URL} from "../../config/config";

describe('demo', function () {

    this.timeout(100000000)
    it('dd',async ()=>{
        console.log('demo')
        let response = await getCellsRequest({
            search_key:{
                script_type:"lock",
                script:{
                    code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                    hash_type: "type",
                    args: "0x5989ae415bb667931a99896e5fbbfad9ba53a223"
                },
            },
            order:"asc",
            limit:"0x64",
            // after_cursor:"0x0",
        },CKB_RPC_INDEX_URL)
        console.log('response:',response)
        console.log('end')
    })

});


// function getBlockNumByCell()
