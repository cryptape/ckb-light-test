import {generateAccountFromPrivateKey, transfer} from "../service/transfer";
import {ACCOUNT_PRIVATE, CKB_RPC_INDEX_URL, script} from "../config/config";


describe('send_transaction', function () {

    // transfer test
    this.timeout(600_000)

    it('发送一笔重复的交易', async () => {

    })
    it('发送一笔链上交易', async () => {
    })

    it('发送一笔包含已经用过cell的交易', async () => {
        600000
    })

    it('发送一笔执行会报错的交易', async () => {

    })

});
