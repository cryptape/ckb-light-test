

describe('sud test', function () {
    this.timeout(100000000);

    function testToUint(bits: number) {
            it(`${bits}`,async ()=>{
                console.log(bits)
            })

    }

    let rt = [8, 16, 32, 64, 96, 128, 224];
    for (let i = 0; i < rt.length; i++) {
        testToUint(rt[i]);
    }
});

