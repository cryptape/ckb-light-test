import {BI, commons, core, hd, helpers, Indexer, RPC, toolkit, WitnessArgs} from "@ckb-lumos/lumos";
import {AGGRON4, generateAccountFromPrivateKey} from "../../service/transfer";
import {utils} from "@ckb-lumos/base";
import {ACCOUNT_PRIVATE} from "../../config/config";
import {issueToken} from "../../service/sudt.util";


describe('sud test', function () {
    this.timeout(100000000);

    function testToUint(bits: number) {
            it(`${bits}`,async ()=>{
                console.log(bits)
            })

    }

    let rt = [8, 16, 32, 64, 96, 128, 224];
    for (let i = 0; i < rt.length; i++) {
        testToUint(rt[i]);
    }
});

