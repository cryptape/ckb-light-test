import {lightClientRPC} from "../../config/config";
import {GET_TIP_HEADER_KEYS} from "./const";
import {checkKeysNotNull} from "./util";

describe('get_tip_header', function () {
    it("demo",async ()=>{
        const header = await lightClientRPC.getTipHeader()
        checkKeysNotNull(header,GET_TIP_HEADER_KEYS)
    })

});
