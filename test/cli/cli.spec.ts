import {
    ACCOUNT_PRIVATE,
    CKB_RPC_INDEX_URL,
    CkbClientNode, indexer,
    LightCli,
    lightClientRPC,
    MINER_SCRIPT
} from "../../config/config";
import {expect} from "chai";
import {Sleep} from "../../service/util";
import {helpers} from "@ckb-lumos/lumos";
import {generateAccountFromPrivateKey} from "../../service/transfer";
import {BI} from "@ckb-lumos/bi";
import {getCellsCapacityRequest} from "../../service/lightService";

describe('cli', function () {
    this.timeout(1000_00000)
    before(async () => {
        // await CkbClientNode.clean()
        // await CkbClientNode.start()
    })
    describe('get-capacity', function () {

        it("--help", async () => {
            await LightCli.cli(" get-capacity --help")
        })
        it("--address, no register,should return failed ", async () => {
            try {
                await LightCli.cli(" get-capacity --address ckt1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgaqan1")
            } catch (e) {
                console.log("e:", e)
                return
            }
            expect("").to.be.equal("failed")
        })

        it("--address ,register address ,should return ckb balance", async () => {
            // register
            await lightClientRPC.setScripts([
                {script: MINER_SCRIPT, scriptType: "lock", blockNumber: "0x0"}
            ])
            let address = helpers.encodeToAddress(MINER_SCRIPT)
            // get cap
            let response = await LightCli.cli(" get-capacity --address " + address)
            expect(response.stdout).to.be.include("CKB")
            expect(response.stdout).to.be.include("synchronized")
        })
    });

    describe('transfer', function () {
        it(" --help", async () => {
            await LightCli.cli(" transfer --help")
        })

        it("demo", async () => {
            let account = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)

            await syncAccountBalanceByCells(account.address, BI.from(1001).mul(10000000))
            let to = account.address
            let cap = "100.1"
            let response = await LightCli.cli(" transfer " +
                " --from-key " + ACCOUNT_PRIVATE +
                " --to-address " + to +
                " --capacity " + cap)
            expect(response.stdout).to.be.include("tx sent")
            console.log("")

        })

        it("use type script InvalidCodeHash", async () => {
            let account = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)

            async function syncAccountBalanceByCells(address: string, minBalance: BI) {
                //get set script msg

                let setScriptTem = helpers.parseAddress(address)

                // check account balance > bi
                let cap = await getCellsCapacityRequest({
                    script: setScriptTem,
                    scriptType: "lock"
                }, CKB_RPC_INDEX_URL)
                if (BI.from(cap.capacity).lt(minBalance)) {
                    throw Error("balance not enough")
                }

                // set script
                let cells = await indexer.getCells({
                    script: setScriptTem,
                    scriptType: "lock"
                })
                let minCellNumHex = cells.objects[0].blockNumber
                await lightClientRPC.setScripts([
                    {script: setScriptTem, scriptType: "lock", blockNumber: minCellNumHex}
                ])
                //wait account update
                while (true) {
                    let cap = await getCellsCapacityRequest({
                        script: setScriptTem,
                        scriptType: "lock"
                    })
                    if (BI.from(cap.capacity).gt(minBalance)) {
                        return
                    }
                    await Sleep(1_1000)
                    console.log("light sync  balance:", BI.from(cap.capacity).toNumber())
                }

            }

            await syncAccountBalanceByCells(account.address, BI.from(1001).mul(10000000))
            let to = account.address
            let cap = "100.1"
            let response = await LightCli.cli(" transfer " +
                " --from-key " + ACCOUNT_PRIVATE +
                " --to-address " + to +
                " --capacity " + cap)
            expect(response.stdout).to.be.include("tx sent")
            console.log("")

        })


    });
    describe('dao', function () {
        it("--help", async () => {
            await LightCli.cli("dao --help")
        })
        it("deposit --help", async () => {

            await LightCli.cli("dao deposit --help")
        })
        it("deposit", async () => {
            const account = generateAccountFromPrivateKey(ACCOUNT_PRIVATE)
            await syncAccountBalanceByCells(account.address, BI.from(1001).mul(10000000))
            await LightCli.cli(" dao deposit --from-key " + ACCOUNT_PRIVATE.substring(2, ACCOUNT_PRIVATE.length) + "  --capacity 150.43")
        })
        it("")

    });

    describe('example-search-key', function () {

        it("--help", async () => {
            await LightCli.cli(" example-search-key --help")
        })
        it("with-filter", async () => {
            await LightCli.cli(" example-search-key --with-filter")
        })

        it("--get-transactions", async () => {
            await LightCli.cli(" example-search-key --get-transactions")
        })

        it("--get-transactions", async () => {
            await LightCli.cli(" example-search-key --with-filter --help")
        })

        it("--get-transactions --with-filter", async () => {
            await LightCli.cli(" example-search-key --get-cells")
        })

        it("-", async () => {
            await LightCli.cli(" example-search-key")
        })
    });

    describe('rpc', function () {

        describe('set-Script', function () {
            it('empty ,should return --allow-empty', async () => {
                try {
                    await LightCli.setScript("")
                } catch (e) {
                    console.log(e)
                    expect(e.toString()).to.be.include("--allow-empty")
                }
            })
            it("--allow-empty", async () => {
                let result = await LightCli.setScript("--allow-empty")
                expect(result.stdout).to.be.include("success")
            })
            it("--help", async () => {
                await LightCli.setScript("--help")
            })
            it("--script file", async () => {
                let response = await LightCli.setScript("--scripts resource/cli/set-script.demo.json")
                expect(response.stdout).to.be.include("success")
            })
            it("--script address,num", async () => {
                let response = await LightCli.setScript("--scripts ckt1qyqvjdmh4re8t7mfjr0v0z27lwwjqu384vhs6lfftr,100")
                expect(response.stdout).to.be.include("0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8")
            })

            it("--script array", async () => {
                let response = await LightCli.setScript("--scripts resource/cli/set-script.demo.json --scripts resource/cli/set-script.demo2.json")
                expect(response.stdout).to.be.include("success")
            })
        });

        describe('get-cells', function () {

            it("--help", async () => {

                await LightCli.cli(" rpc get-cells --help")

            })
            it("search-key", async () => {
                await LightCli.cli(" rpc get-cells --search-key resource/cli/get-cells.demo.json --limit 1")
            })

            it("example-search", async () => {
                await LightCli.cli(" rpc get-cells --search-key resource/cli/example-search-key.json --limit 1")
            })

            it("example-search-withFilter", async () => {
                await LightCli.cli(" rpc get-cells --search-key resource/cli/example-search-key.withFilter.json --limit 1")
            })

            it("--order - asc", async () => {
                await LightCli.cli(" rpc get-cells --search-key resource/cli/get-cells.demo.json --limit 2 --order asc")
            })

            it("--order - desc", async () => {
                //todo check order
                await LightCli.cli(" rpc get-cells --search-key resource/cli/get-cells.demo.json --limit 2 --order desc")
            })

            it("--after", async () => {
                //todo last_cursor
                let response = await LightCli.cli(" rpc get-cells --search-key resource/cli/get-cells.demo.json --limit 2 --order desc --after 0x20000000000000000000000000000000000000000000000000000000000000000000000000000038c5910000000400000003")

            })

        });

        describe('get-Script', function () {

            it("[]", async () => {
                let result = await LightCli.setScript("--allow-empty")
                expect(result.stdout).to.be.include("success")
                let response = await LightCli.cli(" rpc get-scripts")
                expect(response.stdout.toString()).to.be.include("[]")
            })
            it("return data", async () => {
                let response = await LightCli.setScript("--scripts resource/cli/set-script.demo.json")
                expect(response.stdout).to.be.include("success")
                response = await LightCli.cli(" rpc get-scripts")
                expect(response.stdout).to.be.include("script")

            })


        })

        describe('get-peers', function () {
            it("demo", async () => {
                let response = await LightCli.cli(" rpc get-peers")
                expect(response.stdout).to.be.include("version")
            })
        })

        describe('get-transactions', function () {

            it("--help", async () => {
                await LightCli.cli(" rpc get-transactions --help")
            })
            // before(async ()=>{
            //
            //     await setScripts([
            //             {
            //                 script: {
            //                     code_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
            //                     hash_type: "data",
            //                     args: "0x"
            //                 },
            //                 script_type: "lock",
            //                 block_number:"0x0"
            //             }
            //         ]
            //     )
            //     await waitScriptsUpdate(BI.from("100"))
            // })
            it("[]", async () => {
                await LightCli.cli(" rpc get-transactions --search-key resource/cli/get-transactions.[].json --order desc --limit 1")
            })

            it('return data,group = false', async () => {
                //todo check is ok?

                await LightCli.cli(" rpc get-transactions --search-key resource/cli/get-transactions.group.false.json --order desc --limit 1")

            });

            it("example-search-withFilter", async () => {
                await LightCli.cli(" rpc get-transactions --search-key resource/cli/example-search-key.withFilter.json --limit 1")
            })

            it('return data,group = true', async () => {
                //todo check is ok?

                await LightCli.cli(" rpc get-transactions --search-key resource/cli/get-transactions.group.false.json --order desc --limit 1")

            });

        });

        describe('get-cells-capacity', function () {

            it("--help", async () => {
                await LightCli.cli(" rpc get-cells-capacity --help")
            })

            it("example-search-key", async () => {
                await LightCli.cli(" rpc get-cells-capacity --search-key resource/cli/example-search-key.withFilter.json")
            })

            it('demo', async () => {
                await LightCli.cli(" rpc get-cells-capacity --search-key resource/cli/get-cells-capacity.demo.json")
            })
        });

        describe('send-transaction', function () {
            it("return hash", async () => {
                let response = await LightCli.cli(" rpc send-transaction  --transaction resource/cli/transaction-1.json")
                expect(response.stdout).to.be.include("0x")
            })

        });

        describe('get-tip-header', function () {
            it("return response", async () => {
                let response = await LightCli.cli(" rpc get-tip-header")
                expect(response.stdout).to.be.include("version")
            })
        });

        describe('get-genesis-block', function () {
            it("demo", async () => {
                try {
                    let response = await LightCli.cli(" rpc get-genesis-block")

                } catch (e) {
                    expect(e.toString()).to.be.include("RangeError")
                }
            })

        });

        describe("get-header", function () {

            it("return response", async () => {
                let response = await LightCli.cli(" rpc get-header --block-hash 0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606")
                expect(response.stdout).to.be.include("0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606")
            })
            it("return null", async () => {
                let rt = await LightCli.cli(" rpc get-header --block-hash 0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9601")
                expect(rt.stdout).to.be.include("null")
            })
        })

        describe('get-transaction', function () {

            it("return null", async () => {
                await LightCli.cli(" rpc get-transaction --tx-hash 0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606")
            })
            it("return response", async () => {
                let response = await LightCli.cli(" rpc get-transaction --tx-hash 0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37")
                expect(response.stdout).to.be.include("0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37")
            })
        });

        describe("fetch-header", function () {

            it("return fetched", async () => {
                await LightCli.cli(" rpc fetch-header --block-hash 0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606")
            })
            it("return added", async () => {
                await LightCli.cli(" rpc fetch-header --block-hash 0x96f8889fb1afe38ff02e5511ac1190d05eb7eff779362a76913a9e90d75bccc3")
            })

            it("return not found", async () => {
                await LightCli.cli(" rpc fetch-header --block-hash 0x96f8889fb1afe38ff02e5511ac1190d05eb7eff779362a76913a9e90d75bccc1")
                await LightCli.cli(" rpc fetch-header --block-hash 0x96f8889fb1afe38ff02e5511ac1190d05eb7eff779362a76913a9e90d75bccc1")
            })

        })

        describe('fetch-transaction', function () {
            it('return fetched', async () => {
                await LightCli.cli(" rpc fetch-transaction --tx-hash 0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37")
            })
            it("return added", async () => {
                let rt = await LightCli.cli(" rpc fetch-transaction --tx-hash 0x10392f27199e7b570c63ca272ec411a0993be8385fb1c5f31d3ab7a06b6b4421")
                expect(rt.stdout).to.be.include("added")
            })
            it("return not_found", async () => {
                await LightCli.cli(" rpc fetch-transaction --tx-hash 0xd0392f27199e7b570c63ca272ec411a0993be8385fb1c5f31d3ab7a06b6b4426")
                await Sleep(5_000)
                let rt = await LightCli.cli(" rpc fetch-transaction --tx-hash 0xd0392f27199e7b570c63ca272ec411a0993be8385fb1c5f31d3ab7a06b6b4426")
                expect(rt.stdout).to.be.include("not_found")
            })

        })

    });

    it('help', async () => {
        let response = await LightCli.help()
        expect(response.stdout).to.be.include("Usage: ckb-cli-light-client [OPTIONS] ")
    })

    it('version', async () => {
        let response = await LightCli.version()
        // expect
        expect(response.stdout).to.be.include("ckb-cli-light-client")

    })

});

export async function syncAccountBalanceByCells(address: string, minBalance: BI) {
    //get set script msg

    let setScriptTem = helpers.parseAddress(address)

    // check account balance > bi
    let cap = await getCellsCapacityRequest({
        script:setScriptTem,
        scriptType:"lock",
    }, CKB_RPC_INDEX_URL)
    if (BI.from(cap.capacity).lt(minBalance)) {
        throw Error("balance not enough")
    }

    // set script
    let cells = await indexer.getCells({script:setScriptTem,scriptType:"lock"})
    let minCellNumHex = cells.objects[0].blockNumber
    await lightClientRPC.setScripts([
        {script: setScriptTem, scriptType: "lock", blockNumber: minCellNumHex}
    ])
    //wait account update
    while (true) {
        let cap = await getCellsCapacityRequest({
            script:setScriptTem,
            scriptType:"lock"
        })
        if (BI.from(cap.capacity).gt(minBalance)) {
            return
        }
        await Sleep(1_1000)
        console.log("light sync  balance:", BI.from(cap.capacity).toNumber())
    }

}
