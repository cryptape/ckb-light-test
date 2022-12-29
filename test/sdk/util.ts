import {expect} from "chai";
import {utils} from "@ckb-lumos/base";

export function checkKeysNotNull(objs:any,keys:string[]) {
    for (let i = 0; i < keys.length; i++) {
        console.log(objs[keys[i]])
        expect(objs[keys[i]]).to.be.not.null
    }
}
export function checkDD(){
    utils.deepCamel("")
}


