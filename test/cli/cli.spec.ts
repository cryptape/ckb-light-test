import {LightCli} from "../../config/config";
import {expect} from "chai";

describe('cli', function () {
    describe('get-capacity', function () {

    });

    describe('transfer', function () {

    });
    describe('dao', function () {

    });

    describe('example-search-key', function () {

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
                expect(result).to.be.include("success")
            })
        });
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

// async function runSuccExpected(cmd:string,)
