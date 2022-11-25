import {RPC} from "@ckb-lumos/lumos";


export const CKB_TEST_RPC_URL = "https://mainnet.ckb.dev/";
export const CKB_UNIFRA_RPC_URL = "https://ckb-mirana.unifra.io/v1/4fb36720a57340d39aee4cf68511064a";
export const TestCkBkbClient = new RPC(CKB_TEST_RPC_URL);
export const UnifraCkbClient = new RPC(CKB_UNIFRA_RPC_URL)
