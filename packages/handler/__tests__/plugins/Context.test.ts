import { Context } from "~/index";

describe("Context", () => {
    it("should construct a base context", () => {
        const context = new Context({
            WEBINY_VERSION: "test"
        });

        expect(context).toBeInstanceOf(Context);
        expect(context).toEqual({
            plugins: {
                _byTypeCache: {},
                plugins: {}
            },
            WEBINY_VERSION: "test",
            args: [],
            waiters: []
        });
        expect(context.plugins).toEqual({
            _byTypeCache: {},
            plugins: {}
        });
        expect(context.args).toEqual([]);
        expect(context.WEBINY_VERSION).toEqual("test");
    });

    it("should wait for a variable to be defined on context and then trigger the callable", async () => {
        const context = new Context({
            WEBINY_VERSION: "test"
        });

        const tester = {
            cms: false
        };

        context.waitFor<Context>("cms", () => {
            tester.cms = true;
        });
        expect((context as any).cms).toBeUndefined();

        (context as any).cms = {
            loaded: true
        };
        expect((context as any).cms).toEqual({
            loaded: true
        });
    });
});
