import {CKB_TEST_RPC_URL, CKB_UNIFRA_RPC_URL, TestCkBkbClient, UnifraCkbClient} from "./config";
import {expect} from "chai";
import {RPC} from "@ckb-lumos/lumos";
import {request} from "../../service";

describe('Chain', function () {

    this.timeout(1000_000)
    it('get_block',async ()=>{
        let response = await TestCkBkbClient.getBlock("0xb2671d3cc16b7738bbc8902ef11322bc2bfe7c54f5ce4a5cdfdf57b1a02fcb11")
        let response2 = await UnifraCkbClient.getBlock("0xb2671d3cc16b7738bbc8902ef11322bc2bfe7c54f5ce4a5cdfdf57b1a02fcb11")
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("get_block_by_number",async ()=>{
        let response = await TestCkBkbClient.getBlockByNumber("0x400")
        let response2 = await UnifraCkbClient.getBlockByNumber("0x400")
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("get_header",async ()=>{
        let response = await TestCkBkbClient.getHeader("0xb2671d3cc16b7738bbc8902ef11322bc2bfe7c54f5ce4a5cdfdf57b1a02fcb11")
        let response2 = await UnifraCkbClient.getHeader("0xb2671d3cc16b7738bbc8902ef11322bc2bfe7c54f5ce4a5cdfdf57b1a02fcb11")
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())

    })
    it("get_header_by_number",async ()=>{
        let response = await TestCkBkbClient.getHeaderByNumber("0x400")
        let response2 = await UnifraCkbClient.getHeaderByNumber("0x400")
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("get_block_filter",async ()=>{

        let response = await request(1,CKB_TEST_RPC_URL,"get_block_filter",["0xb2671d3cc16b7738bbc8902ef11322bc2bfe7c54f5ce4a5cdfdf57b1a02fcb11"])
        let response2 = await request(1,CKB_UNIFRA_RPC_URL,"get_block_filter",["0xb2671d3cc16b7738bbc8902ef11322bc2bfe7c54f5ce4a5cdfdf57b1a02fcb11"])
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("get_transaction",async ()=>{
        let response = await TestCkBkbClient.getTransaction("0x037dafd7f9c6f742e8c9f225191b441b0b5c4e8b3c1e87c29a2f2ec2fbbf6934")
        let response2 = await UnifraCkbClient.getTransaction("0x037dafd7f9c6f742e8c9f225191b441b0b5c4e8b3c1e87c29a2f2ec2fbbf6934")
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("get_block_hash",async ()=>{
        let response = await TestCkBkbClient.getBlockHash("0x400")
        let response2 = await UnifraCkbClient.getBlockHash("0x400")
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())

    })
    it("get_tip_header",async ()=>{
        let response = await TestCkBkbClient.getTipHeader()
        let response2 = await UnifraCkbClient.getTipHeader()
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("get_live_cell",async ()=>{
        let response = await TestCkBkbClient.getLiveCell( {
                "index": "0x0",
                "txHash": "0x037dafd7f9c6f742e8c9f225191b441b0b5c4e8b3c1e87c29a2f2ec2fbbf6934"
            },
            true)
        let response2 = await UnifraCkbClient.getLiveCell( {
                "index": "0x0",
                "txHash": "0x037dafd7f9c6f742e8c9f225191b441b0b5c4e8b3c1e87c29a2f2ec2fbbf6934"
            },
            true)
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("get_tip_block_number",async ()=>{

        let response = await TestCkBkbClient.getTipBlockNumber()
        let response2 = await UnifraCkbClient.getTipBlockNumber()
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())

    })
    it("get_current_epoch",async ()=>{
        let response = await TestCkBkbClient.getCurrentEpoch()
        let response2 = await UnifraCkbClient.getCurrentEpoch()
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("get_epoch_by_number",async ()=>{
        let response = await TestCkBkbClient.getEpochByNumber("0x0")
        let response2 = await UnifraCkbClient.getEpochByNumber("0x0")
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })

    it("get_block_economic_state",async ()=>{
        let response = await TestCkBkbClient.getBlockEconomicState("0xb2671d3cc16b7738bbc8902ef11322bc2bfe7c54f5ce4a5cdfdf57b1a02fcb11")
        let response2 = await UnifraCkbClient.getBlockEconomicState("0xb2671d3cc16b7738bbc8902ef11322bc2bfe7c54f5ce4a5cdfdf57b1a02fcb11")
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("get_transaction_proof",async ()=>{
        let response = await TestCkBkbClient.getTransactionProof(["0x037dafd7f9c6f742e8c9f225191b441b0b5c4e8b3c1e87c29a2f2ec2fbbf6934"])
        let response2 = await UnifraCkbClient.getTransactionProof(["0x037dafd7f9c6f742e8c9f225191b441b0b5c4e8b3c1e87c29a2f2ec2fbbf6934"])
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("verify_transaction_proof",async ()=>{
        let response = await TestCkBkbClient.verifyTransactionProof({
            "blockHash": "0xb3c5b9789dff3821e298a62e6cc4060accb19ed2558f988a8826573252b9ae20",
            "proof": {
                "indices": [ "0x6" ],
                "lemmas": [
                    "0xdeffa7c8e12d1bb51a1132c90e413c28210f55b8dcdadb8f47dd4621a6a08355",
                    "0x6d6bf0ffd88205f62e41eefc78a95abf8353843ff7b41a85dd2ce0750fa61a51"
                ]
            },
            "witnessesRoot": "0xdcfb809616396e599c598b156769b2076be639232f29dedff51c5bd81eb03626"
        })
        let response2 = await UnifraCkbClient.verifyTransactionProof({
            "blockHash": "0xb3c5b9789dff3821e298a62e6cc4060accb19ed2558f988a8826573252b9ae20",
            "proof": {
                "indices": [ "0x6" ],
                "lemmas": [
                    "0xdeffa7c8e12d1bb51a1132c90e413c28210f55b8dcdadb8f47dd4621a6a08355",
                    "0x6d6bf0ffd88205f62e41eefc78a95abf8353843ff7b41a85dd2ce0750fa61a51"
                ]
            },
            "witnessesRoot": "0xdcfb809616396e599c598b156769b2076be639232f29dedff51c5bd81eb03626"
        })
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })

    // it("get_fork_block",async ()=>{
    //     let response = await TestCkBkbClient.getForkBlock("0xb3c5b9789dff3821e298a62e6cc4060accb19ed2558f988a8826573252b9ae20")
    //     let response2 = await UnifraCkbClient.get_fork_block("0xb3c5b9789dff3821e298a62e6cc4060accb19ed2558f988a8826573252b9ae20")
    //     console.log("response1:",response)
    //     console.log("response2:",response2)
    //     expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    //
    // })
    it("get_consensus",async ()=>{
        let response = await TestCkBkbClient.getConsensus()
        let response2 = await UnifraCkbClient.getConsensus()
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })
    it("get_block_median_time",async ()=>{
        let response = await request(1,CKB_TEST_RPC_URL,"get_block_median_time",["0xb3c5b9789dff3821e298a62e6cc4060accb19ed2558f988a8826573252b9ae20"])
        let response2 = await request(1,CKB_UNIFRA_RPC_URL,"get_block_median_time",["0xb3c5b9789dff3821e298a62e6cc4060accb19ed2558f988a8826573252b9ae20"])
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())
    })

    it("estimate_cycles",async ()=>{
        let response = await request(1,CKB_TEST_RPC_URL,"get_block_median_time",
            [
                {
                    "cell_deps": [
                        {
                            "dep_type": "code",
                            "out_point": {
                                "index": "0x0",
                                "tx_hash": "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3"
                            }
                        }
                    ],
                    "header_deps": [
                        "0x7978ec7ce5b507cfb52e149e36b1a23f6062ed150503c85bbf825da3599095ed"
                    ],
                    "inputs": [
                        {
                            "previous_output": {
                                "index": "0x0",
                                "tx_hash": "0x365698b50ca0da75dca2c87f9e7b563811d3b5813736b8cc62cc3b106faceb17"
                            },
                            "since": "0x0"
                        }
                    ],
                    "outputs": [
                        {
                            "capacity": "0x2540be400",
                            "lock": {
                                "code_hash": "0x28e83a1277d48add8e72fadaa9248559e1b632bab2bd60b27955ebc4c03800a5",
                                "hash_type": "data",
                                "args": "0x"
                            },
                            "type": null
                        }
                    ],
                    "outputs_data": [
                        "0x"
                    ],
                    "version": "0x0",
                    "witnesses": []
                }
            ]
        )
        let response2 = await request(1,CKB_UNIFRA_RPC_URL,"get_block_median_time",

                {
                    "cell_deps": [
                        {
                            "dep_type": "code",
                            "out_point": {
                                "index": "0x0",
                                "tx_hash": "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3"
                            }
                        }
                    ],
                    "header_deps": [
                        "0x7978ec7ce5b507cfb52e149e36b1a23f6062ed150503c85bbf825da3599095ed"
                    ],
                    "inputs": [
                        {
                            "previous_output": {
                                "index": "0x0",
                                "tx_hash": "0x365698b50ca0da75dca2c87f9e7b563811d3b5813736b8cc62cc3b106faceb17"
                            },
                            "since": "0x0"
                        }
                    ],
                    "outputs": [
                        {
                            "capacity": "0x2540be400",
                            "lock": {
                                "code_hash": "0x28e83a1277d48add8e72fadaa9248559e1b632bab2bd60b27955ebc4c03800a5",
                                "hash_type": "data",
                                "args": "0x"
                            },
                            "type": null
                        }
                    ],
                    "outputs_data": [
                        "0x"
                    ],
                    "version": "0x0",
                    "witnesses": []
                }

        )
        console.log("response1:",response)
        console.log("response2:",response2)
        expect(JSON.stringify(response).toString()).to.be.equal(JSON.stringify(response2).toString())

    })
});

