import {config, helpers, Indexer, RPC} from "@ckb-lumos/lumos";
import {LightClient} from "../service/node";


const CKB_LIGHT_CLIENT_PATH = "startBlockchain/ckbLightClient/ckb-light-client"
const RPC_DEBUG = true
const CKB_RPC_URL = "https://testnet.ckb.dev";
const CKB_RPC_INDEX_URL = "https://testnet.ckb.dev/indexer";
const CKB_LIGHT_RPC_URL = "http://localhost:9000";
export enum FeeRate {
    SLOW = 1000,
    NORMAL = 100000,
    FAST = 10000000
}
const FEE = FeeRate.NORMAL
config.initializeConfig(
    config.predefined.AGGRON4
);
const script = helpers.parseAddress(
    "ckt1qyqvjdmh4re8t7mfjr0v0z27lwwjqu384vhs6lfftr"
);
const MINER_SCRIPT = helpers.parseAddress("ckt1qyqvjdmh4re8t7mfjr0v0z27lwwjqu384vhs6lfftr")
const MINER_SCRIPT2 = helpers.parseAddress("ckt1qyq8ph2ywxpvkl5l0rcsugcnwcfswqpqngeqqmfuwq")
const CkbClientNode = new LightClient(CKB_LIGHT_CLIENT_PATH)

const deprecatedAddr = helpers.generateAddress(script);
const newFullAddr = helpers.encodeToAddress(script);
const rpcCLient = new RPC(CKB_RPC_URL);
const { AGGRON4, LINA } = config.predefined;
const RPC_NETWORK = AGGRON4;
const ACCOUNT_PRIVATE = "0xdd50cac37ec6dd12539a968c1a2cbedda75bd8724f7bcad486548eaabb87fc8b"

const indexer = new Indexer(CKB_RPC_INDEX_URL, CKB_RPC_URL);

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
    MINER_SCRIPT2
}
