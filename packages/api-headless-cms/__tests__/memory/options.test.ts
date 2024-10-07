import { iterate } from "./iterate";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";

/**
 * For this test to run we actually need to have the memory testing environment variable set to true.
 * We do not want to run this test on every test run because it is extremely slow.
 */
const runTest = process.env.MEMORY_TESTING ? it : it.skip;

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
            const { options } = useGraphQLHandler({
                path: "manage/en-US"
            });

            let calls = 0;

            await iterate(size, async () => {
                await options();
                calls++;
            });
            expect(calls).toEqual(size);
        }
    );
});
