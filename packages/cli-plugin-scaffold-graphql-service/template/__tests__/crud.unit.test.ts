import { getPK } from "../utils";

/**
 * An example of a unit test. You can use these to test a unit in your code, for example
 * a function or a class. Note that, while these tests are fast to run, most often,
 * these do not provide a high level of confidence that our application works.
 * https://www.webiny.com/docs/tutorials
 */

describe("getPK function test", () => {
    test("by default, must use `Targets` as the PK base", async () => {
        expect(getPK()).toBe(`Targets_TEST_RUN_${process.env.TEST_RUN_ID}`);
    });

    test("function must use provided base", async () => {
        expect(getPK('Targets#XYZ')).toBe(`Targets#XYZ_TEST_RUN_${process.env.TEST_RUN_ID}`);
    });
});
