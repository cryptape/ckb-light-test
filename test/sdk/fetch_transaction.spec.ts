import {waitFetchedHeaderStatusChange} from "../fetch_header.spec";
import {waitFetchTransactionStatusChange} from "../fetch_transaction.spec";

describe('sdk:fetch_transaction', function () {

    this.timeout(10_000)
    it("not_found",async ()=>{
        const hash = randomHash()
        await waitFetchTransactionStatusChange(hash,"not_found", 100)
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
