import {exec} from "child_process";


export class LightClientCli {

    readonly dirPath: string;
    readonly CLI:string;
    constructor(path: string,url:string) {
        this.dirPath = path
        this.CLI = path+"/target/debug/ckb-cli-light-client --rpc "+url+" --debug "
    }

    async help(): Promise<any> {
        return await this.cli("--help")
    }

    async setScript(data:string):Promise<any>{
        return await this.cli(" rpc set-scripts "+ data)
    }


    async cli(data:string):Promise<any>{
        return await sh(  this.CLI+data)
    }

    async version():Promise<any>{
        return await sh(this.CLI+"--version")
    }

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

