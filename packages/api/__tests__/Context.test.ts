import { Context } from "~/index";
import { Context as ContextInterface } from "~/types";
import { Benchmark } from "~/Benchmark";
import { BenchmarkPlugin } from "~/plugins/BenchmarkPlugin";

interface DummyContextInterface extends ContextInterface {
    cms: any;
    pageBuilder: any;
    formBuilder: any;
}

describe("Context", () => {
    it("should construct a base context", () => {
        const context = new Context({
            WEBINY_VERSION: "test"
        });

        expect(context).toBeInstanceOf(Context);
        expect(context).toMatchObject({
            benchmark: expect.any(Benchmark),
            plugins: {
                _byTypeCache: {},
                plugins: {
                    ["context.benchmark"]: new BenchmarkPlugin(context.benchmark)
                }
            },
            WEBINY_VERSION: "test",
            waiters: []
        });
        expect(context.plugins).toEqual({
            _byTypeCache: {},
            plugins: {
                ["context.benchmark"]: new BenchmarkPlugin(context.benchmark)
            }
        });
        expect(context.WEBINY_VERSION).toEqual("test");
    });

    it("should wait for a variable to be defined on context and then trigger the callable", async () => {
        const context = new Context({
            WEBINY_VERSION: "test"
        }) as unknown as DummyContextInterface;

        const tester = {
            cms: 0,
            formBuilder: 0,
            pageBuilder: 0
        };

        context.waitFor("cms", () => {
            tester.cms++;
        });
        expect(context.cms).toBeUndefined();

        context.cms = {
            loaded: 1
        };

        expect(tester).toEqual({
            cms: 1,
            pageBuilder: 0,
            formBuilder: 0
        });

        expect(context.cms).toEqual({
            loaded: 1
        });

        context.waitFor(["pageBuilder", "formBuilder"], () => {
            tester.pageBuilder++;
            tester.formBuilder++;
        });

        context.pageBuilder = {
            loaded: true
        };

        expect(tester).toEqual({
            cms: 1,
            pageBuilder: 0,
            formBuilder: 0
        });

        context.formBuilder = {
            loaded: true
        };

        context.formBuilder = {
            loaded: true
        };

        expect(tester).toEqual({
            cms: 1,
            pageBuilder: 1,
            formBuilder: 1
        });

        expect(context.pageBuilder).toEqual({
            loaded: true
        });
        expect(context.formBuilder).toEqual({
            loaded: true
        });
    });
});
