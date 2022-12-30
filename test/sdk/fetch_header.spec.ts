import { rpcCLient} from "../../config/config";
import {FetchFlag} from "@ckb-lumos/light-client/lib/type";
import {waitFetchedHeaderStatusChange} from "../fetch_header.spec";

describe('sdk:fetch_header', function () {
    it("not found",async ()=>{
        const hash  = randomHash()
        let response = await waitFetchedHeaderStatusChange(hash,FetchFlag.NotFound,100)
        console.log("res:",response)

    })

});

async function getRandomHash(){
    const blocks = await rpcCLient.getBlockByNumber("0x73318")
    console.log("block:",blocks)
    return blocks.header.hash
}

function randomHash() {
    let length = "b123a1a3199a3d7a5dc4dc25feec4925cfa0edb14260e1f6b50e55ab862d0e5c".length
    let str = '0123456789abcdef';
    let result = '';
    for (let i = length; i > 0; --i)
        result += str[Math.floor(Math.random() * str.length)];
    return "0x" + result;
}
