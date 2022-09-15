import {exec} from "child_process";


class LightClient {

    readonly dirPath: string;
    readonly url: string;

    constructor(path: string) {
        this.dirPath = path
        this.url = "http://localhost:9000"
    }

    async start(): Promise<boolean> {
        await sh("ls " + this.dirPath + "/target/release")
        await sh("cd " + this.dirPath + "/target/release && RUST_LOG=info,ckb_light_client=trace ./ckb-light-client run --config-file ./config.toml > node.log 2>&1 &")
        return true
    }

    async stop(): Promise<boolean> {

        await sh("pkill ckb-light-client")
        return true
    }

    async clean(): Promise<boolean> {
        try {
            await this.stop()

        } catch (e) {
            console.log(e)
        }
        await sleep(1000)

        await sh("rm -rf " + this.dirPath + "/target/release/data")
        return true
    }

    async status(): Promise<any> {
        try {
            await sh("curl " + this.url + "/ -X POST -H \"Content-Type: application/json\" -d '{\"jsonrpc\": \"2.0\", \"method\": \"get_tip_header\", \"params\": [], \"id\": 1}'")
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    }
}

export {
    LightClient
}


async function sh(cmd: string) {
    console.log('sh:', cmd)
    return new Promise(function (resolve, reject) {
        exec(cmd, { timeout: 10000},(err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                console.log('response:', stdout)
                resolve({stdout, stderr});
            }
        });
    });

}


async function sleep(timeOut: number) {
    await new Promise(r => setTimeout(r, timeOut));
}

