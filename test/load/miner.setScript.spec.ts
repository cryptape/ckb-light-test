
import {
    CKB_LIGHT_RPC_URL,
    CKB_RPC_INDEX_URL, lightClientRPC,
    MINER_SCRIPT,
    MINER_SCRIPT2,
    MINER_SCRIPT3,
    rpcCLient,
} from "../../config/config";
import {BI} from "@ckb-lumos/bi";
import {getCellsByRange, getTransactionList} from "../../service/txService";
import {HexString} from "@ckb-lumos/base/lib/primitive";
import {expect} from "chai";
import {Cell} from "@ckb-lumos/base/lib/api";
import {getBlockNumByTxHash} from "../../service/transfer";
import {Script} from "@ckb-lumos/base";
import {checkScriptsInLightClient, getCellsCapacityRequest, waitScriptsUpdate} from "../../service/lightService";
import {LightClientScript} from "_@ckb-lumos_light-client@0.20.0-alpha.0@@ckb-lumos/light-client/src/type";
import {HexadecimalRange} from "_@ckb-lumos_lumos@0.19.0@@ckb-lumos/lumos";

describe('monit miner test', function () {
    this.timeout(1000 * 10000000)

    let SkipNum = 15
    let minerScripts: Script[] = [MINER_SCRIPT, MINER_SCRIPT2, MINER_SCRIPT3]
    let step = 50000
    let ckb_tip_number = "0x6aa10b";


    let idx = 0

    function SkipStep(step: number): boolean {
        idx++
        return (idx % step) == 0
    }

    before(async () => {
        if (!(await checkScriptsInLightClient(minerScripts))) {
            let setScriptObjs: LightClientScript[] = minerScripts.map(script => {
                return {
                    script: script,
                    scriptType: "lock",
                    blockNumber: "0x0"
                }
            })
            await lightClientRPC.setScripts(setScriptObjs)
        }

        ckb_tip_number = await rpcCLient.getTipBlockNumber()
        await waitScriptsUpdate(BI.from(6990015))
    })


    describe('getCells', async () => {
        for (let i = 0; i < BI.from(ckb_tip_number).toNumber(); i += step) {
            for (let j = 0; j < minerScripts.length; j++) {
                if (!SkipStep(SkipNum)) continue;
                it('miner:' + minerScripts[j].args.substring(0, 6) + "-" + i + "-" + (i + step), async () => {
                    await compareCells(minerScripts[j], [BI.from(i).toHexString(), BI.from((i + step)).toHexString()])
                })
            }
        }
    })

    describe.skip('getTransactions', async () => {
        for (let i = 0; i < BI.from(ckb_tip_number).toNumber(); i += step) {
            for (let j = 0; j < minerScripts.length; j++) {
                if (!SkipStep(SkipNum)) continue;
                it('miner:' + minerScripts[j].args.substring(0, 6) + "-" + i + "-" + (i + step), async () => {
                    await compareTransactions(minerScripts[j], [BI.from(i).toHexString(), BI.from((i + step)).toHexString()])
                })
            }

        }
    });

    describe('getCellsCapacity', function () {
        for (let i = 0; i < minerScripts.length; i++) {
            it('miner:' + minerScripts[i].args.substring(0, 6), async () => {
                let capLightResult = await getCellsCapacityRequest({
                    script:minerScripts[i],
                    scriptType:"lock"
                })
                let indexResult = await getCellsCapacityRequest({
                    script:minerScripts[i],scriptType:"lock"
                }, CKB_RPC_INDEX_URL)
                console.log('light client cap:', BI.from(capLightResult).toNumber())
                console.log('index client cap:', BI.from(indexResult.capacity).toNumber())
                // expected 相差不大

            })
        }
    });

});

/**
 * compare getTransactions result of ckbLight , ckbIndex
 * @param compareScript
 * @param block_range
 */
async function compareTransactions(compareScript: Script, block_range: HexadecimalRange) {
    let height = await getScriptUpdateHeight()
    let lightCollectedTxsReq = getTransactionList(compareScript, "lock", undefined, CKB_LIGHT_RPC_URL, block_range)
    let indexCollectedTxs = await getTransactionList(compareScript, "lock", undefined, CKB_RPC_INDEX_URL, block_range)
    let lightCollectedTxs = await lightCollectedTxsReq
    if (lightCollectedTxs.length != indexCollectedTxs.length) {
        // compare collected txs length
        let lightNotInIndexTxs = lightCollectedTxs.filter(lightTx => indexCollectedTxs.some(indexTx => lightTx == indexTx))
        let indexNotInLightTxs = indexCollectedTxs.filter(indexIx => lightCollectedTxs.some(lightTx => lightTx == indexIx))

        console.log('== lightNotInIndexTxs ==')
        lightNotInIndexTxs.forEach(tx => console.log(tx))
        console.log("== indexNotInLightTxs ==")
        indexNotInLightTxs.forEach(tx => console.log(tx))

        // find tx < getScript.height
        let lightNotUpdateTxs = []
        for (let i = 0; i < indexNotInLightTxs.length; i++) {
            let tx = lightNotInIndexTxs[i]
            let currentHeight = await getBlockNumByTxHash(tx)
            if (currentHeight.lt(height)) {
                lightNotUpdateTxs.push(tx)
            }
        }
        console.log("=====light not update=====")
        lightNotInIndexTxs.forEach(tx => console.log(tx))

        expect(lightNotInIndexTxs.length).to.be.equal(0)
        // get update height
        // expect(lightCollectedTxs.length).to.be.equal(indexCollectedTxs.length)
        return
    }
    lightCollectedTxs = lightCollectedTxs.sort()
    indexCollectedTxs = indexCollectedTxs.sort()
    let notEqTxs: { lightTx: string, indexTx: string }[] = []
    for (let i = 0; i < lightCollectedTxs.length; i++) {
        if (lightCollectedTxs[i] != indexCollectedTxs[i]) {
            notEqTxs.push({lightTx: lightCollectedTxs[i], indexTx: indexCollectedTxs[i]})
        }
    }
    notEqTxs.forEach(tx => {
        console.log('not eq, lightClient tx:', tx.lightTx, " indexTx:", tx.indexTx)
    })
    expect(notEqTxs.length).to.be.equal(0)
}

async function compareCells(compareScript: Script, block_range: HexadecimalRange) {
    let height = await getScriptUpdateHeight()
    let lightCellsReq = getCellsByRange(compareScript, "lock", undefined, CKB_LIGHT_RPC_URL, block_range)
    let indexCells = await getCellsByRange(compareScript, "lock", undefined, CKB_RPC_INDEX_URL, block_range)
    let lightCells = await lightCellsReq
    if (lightCells.length != indexCells.length) {
        //todo add if light cell > index cell : the  cell should : cost status or sync
        let lightNotInIndexTxs = lightCells.filter(lightTx => !indexCells.some(indexTx => compareCell(lightTx, indexTx)))
        let indexNotInLightTxs = indexCells.filter(indexIx => !lightCells.some(lightTx => compareCell(lightTx, indexIx)))
        console.log('== lightNotInIndexTxs ==')
        lightNotInIndexTxs.forEach(tx => console.log(
            "blockNum:", tx.blockNumber,
            " hash:", tx.outPoint?.txHash,
            " index:", tx.outPoint?.index
        ))
        console.log("== indexNotInLightTxs ==")
        indexNotInLightTxs.forEach(tx => console.log(
            "blockNum:", tx.blockNumber,
            " hash:", tx.outPoint?.txHash,
            " index:", tx.outPoint?.index
        ))

        let lightNotUpdateCells = indexNotInLightTxs.filter(cell =>
            BI.from(cell.blockNumber).lte(height)
        )
        console.log("=== light not update ====")
        lightNotUpdateCells.forEach(tx => console.log(
            "blockNum:", tx.blockNumber,
            " hash:", tx.outPoint?.txHash,
            " index:", tx.outPoint?.index
        ))
        expect(lightNotUpdateCells.length).to.be.equal(0)
        return
    }
    indexCells = indexCells.sort()
    lightCells = lightCells.sort()
    let notEqList: { lightCell: Cell, indexCell: Cell }[] = []
    for (let i = 0; i < lightCells.length; i++) {
        let lightCell = lightCells[i]
        let indexCell = indexCells[i]
        if (!compareCell(lightCell, indexCell)) {
            notEqList.push({lightCell: lightCell, indexCell: indexCell})
        }
    }
    notEqList.forEach(notRqCell => {
        console.log("light cell block:" + BI.from(notRqCell.lightCell.blockNumber).toNumber() + " tx:" + notRqCell.lightCell.outPoint?.txHash + " index:" + notRqCell.lightCell.outPoint?.index +
            "index cell block:" + BI.from(notRqCell.indexCell.blockNumber).toNumber() + " tx:" + notRqCell.indexCell.outPoint?.txHash + " index:" + notRqCell.indexCell.outPoint?.index)
    })

}

async function getScriptUpdateHeight(): Promise<BI> {
    let height = (await lightClientRPC.getScripts()).reduce((total, current) => {
        return BI.from(current.blockNumber).lt(total) ? BI.from(current.blockNumber) : total;
    }, BI.from("0xffffffffff"))
    if (height == BI.from("0xffffffffff")) {
        return BI.from(0)
    }
    return height
}

function compareCell(a: Cell, b: Cell): boolean {
    return (a.blockNumber == b.blockNumber &&
        a.data == b.data &&
        a.cellOutput.lock.args == b.cellOutput.lock.args &&
        a.cellOutput.lock.codeHash == b.cellOutput.lock.codeHash &&
        a.cellOutput.lock.hashType == b.cellOutput.lock.hashType &&
        a.outPoint?.txHash == b.outPoint?.txHash &&
        a.outPoint?.index == b.outPoint?.index
    )
}
