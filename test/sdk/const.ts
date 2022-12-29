// curl --location --request POST 'http://localhost:9000' \
// --header 'Content-Type: application/json' \
// --data-raw '{
// "jsonrpc":"2.0",
//     "method":"get_tip_header",
//     "params":undefined,
//     "id":64
// }'
export const rt = {"jsonrpc":"2.0","result":{"compact_target":"0x1d09103a","dao":"0x62cb520625dce84133429b59dba22600161facbd63e40b040080137e72b95a08","epoch":"0x70806f100156f","extra_hash":"0x0000000000000000000000000000000000000000000000000000000000000000","hash":"0x944e0b40b78f49fae32d67a19b4e5d7c63d393ed10b2c6ebf5d12dc851c18793","nonce":"0xb806c877b8f68b860563f580fb6b6758","number":"0x71b40c","parent_hash":"0x6cdc3c48d429fcab6be1a57a9fdb3b0387b1395de3c9c2ba176989349d091d78","proposals_hash":"0x6962dbd01d16d7fc409f629318b3c2f2f8f2f9a5826a81643cb5bc10247d0ebf","timestamp":"0x184a8a34c11","transactions_root":"0x3670189bdc38c2bd76379ed2f65da5a3ef877b751ae7a8cdae34295986125b7f","version":"0x0"},"id":0}
export const GET_TIP_HEADER_KEYS = ["compactTarget","dao","epoch","extraHash","hash","nonce","number","parentHash","proposalsHash","timestamp","transactionsRoot","version"]

//
export const GET_GENESIS_BLOCK = ["a"]
