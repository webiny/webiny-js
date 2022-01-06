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
            _version: "test",
            _args: []
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

        context.waitFor<Context>("cms", ctx => {});
    });
});
