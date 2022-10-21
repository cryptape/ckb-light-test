import {config, helpers, Indexer, RPC} from "@ckb-lumos/lumos";
import {LightClient} from "../service/node";
import {LightClientCli} from "../service/light-cli";

const CKB_CLIENT_CLI_PATH = "tmp/ckb-cli-light-client"
const CKB_LIGHT_CLIENT_PATH = "tmp/startBlockchain/ckbLightClient/ckb-light-client"
const RPC_DEBUG = false
const CKB_RPC_URL = "https://testnet.ckb.dev";
const CKB_RPC_INDEX_URL = "https://testnet.ckb.dev/indexer";
const CKB_LIGHT_RPC_URL = "http://localhost:9000";

export enum FeeRate {
    SLOW = 1000,
    NORMAL = 100000,
    FAST = 10000000
}

const  uint = 100000000

const FEE = FeeRate.NORMAL
config.initializeConfig(
    config.predefined.AGGRON4
);
const script = helpers.parseAddress(
    "ckt1qyqvjdmh4re8t7mfjr0v0z27lwwjqu384vhs6lfftr"
);
const MINER_SCRIPT = helpers.parseAddress("ckt1qyqvjdmh4re8t7mfjr0v0z27lwwjqu384vhs6lfftr")
const MINER_SCRIPT2 = helpers.parseAddress("ckt1qyq8ph2ywxpvkl5l0rcsugcnwcfswqpqngeqqmfuwq")
const MINER_SCRIPT3 = helpers.parseAddress("ckt1qyqd5eyygtdmwdr7ge736zw6z0ju6wsw7rssu8fcve")
const CkbClientNode = new LightClient(CKB_LIGHT_CLIENT_PATH)

const deprecatedAddr = helpers.generateAddress(script);
const newFullAddr = helpers.encodeToAddress(script);
const rpcCLient = new RPC(CKB_RPC_URL);
const {AGGRON4} = config.predefined;
const RPC_NETWORK = AGGRON4;
const ACCOUNT_PRIVATE = "0xdd50cac37ec6dd12539a968c1a2cbedda75bd8724f7bcad486548eaabb87fc8b"
const ACCOUNT_PRIVATE2 = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
const indexer = new Indexer(CKB_RPC_INDEX_URL, CKB_RPC_URL);
const LightCli = new LightClientCli(CKB_CLIENT_CLI_PATH,CKB_LIGHT_RPC_URL)


const EVERY_ONE_CAN_PAY_DATA = {
    "CODE_HASH": '0xe683b04139344768348499c23eb1326d5a52d6db006c0d2fece00a831f3660d7',
    "HASH_TYPE":"data",
    "TX_HASH": '0xbe5d236f316f5608c53aa682351be4114db07b2e843435e843661ded30924c04',
    "INDEX": '0x0',
    "DEP_TYPE": 'code'
}

const EVERY_ONE_CAN_PAY_DATA1 = {
    "CODE_HASH": '0xe683b04139344768348499c23eb1326d5a52d6db006c0d2fece00a831f3660d7',
    "HASH_TYPE":"data1",
    "TX_HASH": '0xbe5d236f316f5608c53aa682351be4114db07b2e843435e843661ded30924c04',
    "INDEX": '0x0',
    "DEP_TYPE": 'code'
}

const EVERY_ONE_CAN_PAY_TYPE_ID = {
    CODE_HASH: '0x8d9fac0888592070fa807f715340395511eed95f8d981afbc7b3c95ea5ff8081',
    HASH_TYPE: 'type',
    TX_HASH: '0xbe5d236f316f5608c53aa682351be4114db07b2e843435e843661ded30924c04',
    INDEX: '0x0',
    DEP_TYPE: 'code'
}
const EVERY_ONE_CAN_PAY = EVERY_ONE_CAN_PAY_TYPE_ID

export {
    FEE,
    CKB_RPC_URL,
    CKB_RPC_INDEX_URL,
    CKB_LIGHT_RPC_URL,
    RPC_DEBUG,
    script,
    deprecatedAddr,
    newFullAddr,
    rpcCLient,
    RPC_NETWORK,
    ACCOUNT_PRIVATE,
    indexer,
    CkbClientNode,
    MINER_SCRIPT,
    MINER_SCRIPT2,
    MINER_SCRIPT3,
    EVERY_ONE_CAN_PAY,
    ACCOUNT_PRIVATE2,
    LightCli,
    EVERY_ONE_CAN_PAY_TYPE_ID,
    EVERY_ONE_CAN_PAY_DATA

}
