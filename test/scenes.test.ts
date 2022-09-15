
describe('scenes', function () {
    describe('start', function () {

        describe('get_scripts', function () {

        });
        describe('get_tip_header', function () {

        });
        describe('get_transaction', function () {

        });
        describe('send_transaction', function () {

        });

    });
    describe('set 几个从0开始的script', function () {

        describe('get_scripts', function () {
            it('查询set的script ', function () {

            });

        });
        describe('get_header', function () {

            it('查询script的number高度以下,被收集的scripthash ', async ()=> {

            });
            it('查询script的number高度以上,还未被收集的scripthash',async ()=>{

            })
        });
        describe('get_transaction', function () {
            it('查询被收集的交易hash',async ()=>{

            })
            it('查询同一区块，但未被收集的交易hash',async ()=>{

            })
            it('查询还未被收集的交易hash',async ()=>{})
        });
        describe('get_cells', function () {
            it('查询被收集的cells',async ()=>{

            })
            it('查询同一笔交易，但未被收集的cells',async ()=>{

            })
        });
        describe('get_transactions', function () {

        });
        describe('get_cells_capacity', function () {


        });
    });
    describe('节点重启后', function () {

        // 111111
    });
    describe('script更新到中间，再次从0开始setScript', function () {
        describe('get_scripts', function () {
            it('script的number 从1 开始递增',async ()=>{})
        });
        describe('get_header', function () {
            it('查询script的number高度以下,被收集的scripthash ', function () {

            });
            it('查询上次script的number高度以下，被收集的scripthash',async()=>{})
            it('查询script上一个number高度以上,还未被收集的scripthash',async ()=>{})
        });
        describe('get_transaction', function () {
            it('查询被收集的交易hash',async ()=>{})
            it('查询上次set script收集的交易hash',async ()=>{})
        });
        describe('get_cells', function () {
            it('查询上次被收集的cells',async ()=>{})
            it('高度未达到上次set_script,get_cell收集的数量不变',async ()=>{})
        });
        describe('get_transactions', function () {
            //

        });
        describe('get_cells_capacity', function () {
            //

        });
    });
    describe('set 几个从中间开始的script', function () {

    });
    describe('script 清空[[]]', function () {

        describe('get_cells', function () {
            it('之前setscript的cell不会继续更新',async ()=>{})

        });
    });
    describe('节点重启后', function () {
        //再次查询上诉结果
    });
});
