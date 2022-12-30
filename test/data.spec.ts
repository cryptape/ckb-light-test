import {BI} from "@ckb-lumos/lumos";
import {HashType} from "@ckb-lumos/base/lib/api";


const EVERY_ONE_CAN_PAY_DATA = {
    "CODE_HASH": '0xe683b04139344768348499c23eb1326d5a52d6db006c0d2fece00a831f3660d7',
    "HASH_TYPE": "data",
    "TX_HASH": '0xbe5d236f316f5608c53aa682351be4114db07b2e843435e843661ded30924c04',
    "INDEX": '0x0',
    "DEP_TYPE": 'code'
}

const EVERY_ONE_CAN_PAY_DATA1 = {
    CODE_HASH:"",
    HASH_TYPE:"data1",
    TX_HASH:"",
    INDEX:"",
    DEP_TYPE:"code"
}

const EVERY_ONE_CAN_PAY_TYPE_ID = {
    CODE_HASH: '0x8d9fac0888592070fa807f715340395511eed95f8d981afbc7b3c95ea5ff8081',
    HASH_TYPE: 'type',
    TX_HASH: '0xbe5d236f316f5608c53aa682351be4114db07b2e843435e843661ded30924c04',
    INDEX: '0x0',
    DEP_TYPE: 'code'
}
const EVERY_ONE_CAN_PAY = EVERY_ONE_CAN_PAY_TYPE_ID

export const TEST_DATA = {
    PUDGE: {
        DATA_CELL: {
            cellOutput: {
                capacity: BI.from(65).mul(100000000).toHexString(),
                lock: {
                    codeHash: EVERY_ONE_CAN_PAY_DATA.CODE_HASH,
                    hashType: getDataType(),
                    args: convertStringToHex("DATA_CELL"),
                },
            },
            data: "0x",
        },
        TYPE_CELL: {
            cellOutput: {
                capacity: BI.from(65).mul(100000000).toHexString(),
                lock: {
                    codeHash: EVERY_ONE_CAN_PAY_TYPE_ID.CODE_HASH,
                    hashType: getType(),
                    args: convertStringToHex("TYPE_CELL"),
                },
            },
            data: "0x",
        },
        DATA1_CELL: {
            cellOutput: {
                capacity: BI.from(65).mul(100000000).toHexString(),
                lock: {
                    codeHash: EVERY_ONE_CAN_PAY_TYPE_ID.CODE_HASH,
                    hashType: getData1Type(),
                    args: convertStringToHex("DATA1_CELL"),
                },
            },
            data: "0x",
        },
        DATA_CELL_WITH_TYPE_NOT_EMPTY:{
            cellOutput:{
                capacity: BI.from(150).mul(100000000).toHexString(),
                lock:{
                    codeHash: EVERY_ONE_CAN_PAY_DATA.CODE_HASH,
                    hashType: getDataType(),
                    args: convertStringToHex("DATA_CELL_WITH_TYPE_NOT_EMPTY-lock"),
                },
                type:{
                    codeHash:EVERY_ONE_CAN_PAY_DATA.CODE_HASH,
                    hashType: getDataType(),
                    args: convertStringToHex("DATA_CELL_WITH_TYPE_NOT_EMPTY-type"),
                }
            },
            data:"0x1234"
        },
        DATA1_CELL_WITH_TYPE_NOT_EMPTY_1:{
            cellOutput:{
                capacity: BI.from(150).mul(100000000).toHexString(),
                lock:{
                    codeHash: EVERY_ONE_CAN_PAY_DATA.CODE_HASH,
                    hashType: getData1Type(),
                    args: convertStringToHex("DATA1_CELL_WITH_TYPE_NOT_EMPTY_1-lock"),
                },
                type:{
                    codeHash:EVERY_ONE_CAN_PAY_DATA.CODE_HASH,
                    hashType: getData1Type(),
                    args: convertStringToHex("DATA1_CELL_WITH_TYPE_NOT_EMPTY_1-type"),
                }
            },
            data:"0x1234"
        },
        DATA1_CELL_WITH_TYPE_NOT_EMPTY_2:{
            cellOutput:{
                capacity: BI.from(150).mul(100000000).toHexString(),
                lock:{
                    codeHash: EVERY_ONE_CAN_PAY_DATA.CODE_HASH,
                    hashType: getData1Type(),
                    args: convertStringToHex("DATA1_CELL_WITH_TYPE_NOT_EMPTY_2-lock"),
                },
                type:{
                    codeHash: EVERY_ONE_CAN_PAY_DATA.CODE_HASH,
                    hashType: getData1Type(),
                    args: convertStringToHex("DATA1_CELL_WITH_TYPE_NOT_EMPTY_2-type"),
                }
            },
            data:"0x123456"
        }
    }

};

function getData1Type(): HashType {
    return "data1";
}

function getType(): HashType {
    return "type"
}

function getDataType(): HashType {

    return "data"
}

export const CURRENT_TEST = TEST_DATA.PUDGE

function convertStringToHex(data:string){
   return "0x"+ Buffer.from(data, 'utf8').toString('hex')
}
