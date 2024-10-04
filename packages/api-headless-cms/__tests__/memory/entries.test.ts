import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { setupContentModelGroup, setupContentModels } from "~tests/testHelpers/setup";
import { Fruit } from "~tests/contentAPI/mocks/contentModels";
import { useFruitManageHandler } from "~tests/testHelpers/useFruitManageHandler";
import { WebinyError } from "@webiny/error";
import { iterate } from "./iterate";

jest.setTimeout(86400000); // 1 day

const mockFruit: Fruit = {
    name: "Orange",
    isSomething: false,
    rating: 109001,
    numbers: [5, 6, 7.2, 10.18, 12.05],
    email: "orange@doe.com",
    url: "https://orange.test",
    lowerCase: "orange",
    upperCase: "ORANGE",
    date: "2020-12-04",
    dateTime: new Date("2020-12-04T12:12:21").toISOString(),
    dateTimeZ: "2020-12-03T14:52:41+01:00",
    time: "13:14:38",
    description: "fruit orange named"
};

const setupFruits = async (manager: ReturnType<typeof useGraphQLHandler>) => {
    const group = await setupContentModelGroup(manager);
    await setupContentModels(manager, group, ["fruit"]);
};
/**
 * For this test to run we actually need to have the memory testing environment variable set to true.
 * We do not want to run this test on every test run because it is extremely slow.
 */
const runTest = process.env.MEMORY_TESTING ? it : it.skip;

describe("memory leak - entries", () => {
    const mainManager = useFruitManageHandler({
        path: "manage/en-US"
    });

    beforeEach(async () => {
        process.env.DEBUG = "showMe!";
        await setupFruits(mainManager);
    });

    /**
     * This test is used to check if the memory consumption is stable after creating a certain amount of entries.
     */
    const message = `should not have high memory consumption after %s of create entry calls`;
    const sizes = [];

    sizes.push(1);
    sizes.push(10);
    sizes.push(50);
    sizes.push(100);
    sizes.push(200);
    sizes.push(300);
    sizes.push(500);
    sizes.push(1000);
    sizes.push(1250);
    sizes.push(1500);
    sizes.push(2000);
    sizes.push(3000);
    sizes.push(4000);
    sizes.push(5000);
    sizes.push(10000);
    sizes.push(20000);

    runTest.each(sizes)(message, async size => {
        // const startMemory = getCurrentMemory();
        await iterate(size, async () => {
            const manager = useFruitManageHandler({
                path: "manage/en-US"
            });

            const [result] = await manager.createFruit({
                data: mockFruit
            });
            const error = result.data?.createFruit?.error;
            if (error) {
                // @ts-expect-error
                throw new WebinyError({
                    message: error.message,
                    code: error.code,
                    data: error.data,
                    stack: error.stack
                });
            }
        });
        // const endMemory = getCurrentMemory();
        // const memoryUsed = bytes.format(endMemory - startMemory, {
        //     unit: "kb"
        // });
        // console.log(`Memory used for ${size}: ${memoryUsed}`);
    });
});
