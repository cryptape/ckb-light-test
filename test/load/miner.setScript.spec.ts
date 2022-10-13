import {
    getCells,
    getCellsCapacity,
    getScripts,
    ScriptMsg,
    ScriptObject,
    setScripts,
    waitScriptsUpdate
} from "../../rpc";
import {
    CKB_LIGHT_RPC_URL,
    CKB_RPC_INDEX_URL,
    MINER_SCRIPT,
    MINER_SCRIPT2,
    MINER_SCRIPT3,
    rpcCLient,
    script
} from "../../config/config";
import {BI} from "@ckb-lumos/lumos";
import {getCellsByRange, getTransactionList} from "../../service/txService";
import {HexString} from "@ckb-lumos/base/lib/primitive";
import {expect} from "chai";
import {Cell} from "@ckb-lumos/base/lib/api";
import {getBlockNumByTxHash} from "../../service/transfer";

describe('monit miner test', function () {
    this.timeout(1000 * 10000000)

    let SkipNum = 15
    let minerScripts: ScriptObject[] = [MINER_SCRIPT, MINER_SCRIPT2, MINER_SCRIPT3]
    let step = 50000
    let ckb_tip_number = "0x6aa10b";


    let idx = 0
    function SkipStep(step:number):boolean{
        idx++
        return  (idx%step) == 0
    }

    before(async () => {
        // let setScriptObjs: ScriptMsg[] = minerScripts.map(script => {
        //     return {
        //         script: script,
        //         script_type: "lock",
        //         block_number: "0x0"
        //     }
        // })
        // await setScripts(setScriptObjs)
        ckb_tip_number = await rpcCLient.get_tip_block_number()
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
                let capLightResult = await getCellsCapacity(minerScripts[i])
                let indexResult = await getCellsCapacity(minerScripts[i], CKB_RPC_INDEX_URL)
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
async function compareTransactions(compareScript: ScriptObject, block_range: HexString[]) {
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
            if (currentHeight.lt(height)){
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

async function compareCells(compareScript: ScriptObject, block_range: HexString[]) {
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
            "blockNum:", tx.block_number,
            " hash:", tx.out_point?.tx_hash,
            " index:", tx.out_point?.index
        ))
        console.log("== indexNotInLightTxs ==")
        indexNotInLightTxs.forEach(tx => console.log(
            "blockNum:", tx.block_number,
            " hash:", tx.out_point?.tx_hash,
            " index:", tx.out_point?.index
        ))

        let lightNotUpdateCells = indexNotInLightTxs.filter(cell=>
            BI.from(cell.block_number).lte(height)
        )
        console.log("=== light not update ====")
        lightNotUpdateCells.forEach(tx => console.log(
            "blockNum:", tx.block_number,
            " hash:", tx.out_point?.tx_hash,
            " index:", tx.out_point?.index
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
        console.log("light cell block:" + BI.from(notRqCell.lightCell.block_number).toNumber() + " tx:" + notRqCell.lightCell.out_point?.tx_hash + " index:" + notRqCell.lightCell.out_point?.index +
            "index cell block:" + BI.from(notRqCell.indexCell.block_number).toNumber() + " tx:" + notRqCell.indexCell.out_point?.tx_hash + " index:" + notRqCell.indexCell.out_point?.index)
    })

}

async function getScriptUpdateHeight(): Promise<BI> {
    let height = (await getScripts()).reduce((total, current) => {
        return BI.from(current.block_number).lt(total) ? BI.from(current.block_number) : total;
    }, BI.from("0xffffffffff"))
    if (height == BI.from("0xffffffffff")) {
        return BI.from(0)
    }
    return height
}

function compareCell(a: Cell, b: Cell): boolean {
    return (a.block_number == b.block_number &&
        a.data == b.data &&
        a.cell_output.lock.args == b.cell_output.lock.args &&
        a.cell_output.lock.code_hash == b.cell_output.lock.code_hash &&
        a.cell_output.lock.hash_type == b.cell_output.lock.hash_type &&
        a.out_point?.tx_hash == b.out_point?.tx_hash &&
        a.out_point?.index == b.out_point?.index
    )
}
