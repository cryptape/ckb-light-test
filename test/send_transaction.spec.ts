import {generateAccountFromPrivateKey, transfer} from "../service/transfer";
import {ACCOUNT_PRIVATE, CKB_RPC_INDEX_URL, script} from "../config/config";
import {getCells} from "../rpc";


describe('send_transaction', function () {

    // transfer test
    this.timeout(100000000)
    it('should ', async () => {
        console.log('demo')
        let acc = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)

        //get cells
        // let cells = await getCells(acc.lockScript,CKB_RPC_INDEX_URL)
        // console.log('cell:',cells)
        // update all cells

        // send tx

        // until cells update

        // get cell  will update

        let tx = await transfer({
            from: acc.address,
            to: "ckt1qyq8s90x8tkwv2hpx6tn8696fx8m7klr6m6stqrkje",
            amount: "500",
            privKey: ACCOUNT_PRIVATE,
        })
        console.log('tx:', tx)

        //
    });

    it('发送一笔重复的交易', async () => {

    })
    it('发送一笔链上交易', async () => {
    })

    it('发送一笔包含已经用过cell的交易', async () => {

    })

    it('发送一笔执行会报错的交易', async () => {

    })

});
