import fastify from "fastify";

/**
 * For this test to run we actually need to have the memory testing environment variable set to true.
 * We do not want to run this test on every test run because it is extremely slow.
 */
const runTest = process.env.MEMORY_TESTING ? it : it.skip;

jest.setTimeout(24 * 60 * 60);

describe("memory leak - options header", () => {
    const sizes: number[] = [];

    sizes.push(1);
    sizes.push(5);
    sizes.push(10);
    sizes.push(50);
    sizes.push(100);
    sizes.push(200);
    sizes.push(300);
    sizes.push(500);
    sizes.push(1000);
    sizes.push(2000);
    sizes.push(3000);
    sizes.push(4000);
    sizes.push(5000);
    sizes.push(10000);
    sizes.push(20000);
    sizes.push(30000);
    sizes.push(40000);
    sizes.push(50000);
    sizes.push(40000);
    sizes.push(30000);
    sizes.push(20000);
    sizes.push(10000);
    sizes.push(5000);
    sizes.push(4000);
    sizes.push(3000);
    sizes.push(2000);
    sizes.push(1000);
    sizes.push(500);
    sizes.push(300);
    sizes.push(200);
    sizes.push(100);
    sizes.push(50);
    sizes.push(10);
    sizes.push(5);
    sizes.push(1);

    runTest.each(sizes)(
        "should not have high memory consumption after %s of create entry calls",
        async size => {
            const app = fastify({});

            app.options("/webiny-test", async (_: unknown, res) => {
                return res.send({
                    success: true
                });
            });

            await app.ready();

            let calls = 0;
            const timeStart = new Date();
            const memoryStart = process.memoryUsage().heapUsed;
            for (let current = 0; current < size; current++) {
                await app.inject({
                    path: "/webiny-test",
                    method: "OPTIONS",
                    query: {},
                    payload: JSON.stringify({})
                });
                calls++;
            }
            const timeEnd = new Date();
            const memoryEnd = process.memoryUsage().heapUsed;

            console.log({
                amount: size,
                calls,
                timeElapsed: `${(timeEnd.getTime() - timeStart.getTime()) / 1000} s`,
                memoryStart: `${memoryStart / 1024 / 1024} MB`,
                memoryEnd: `${memoryEnd / 1024 / 1024} MB`,
                memoryUsed: `${(memoryEnd - memoryStart) / 1024 / 1024} MB`
            });

            expect(calls).toEqual(size);
        }
    );
});
