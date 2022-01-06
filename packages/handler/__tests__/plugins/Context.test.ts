import { Context } from "~/index";
import { Context as ContextInterface } from "~/types";

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
        }) as unknown as DummyContextInterface;

        const tester = {
            cms: false,
            formBuilder: false,
            pageBuilder: false
        };

        context.waitFor("cms", () => {
            tester.cms = true;
        });
        expect(context.cms).toBeUndefined();

        context.cms = {
            loaded: true
        };
        expect(context.cms).toEqual({
            loaded: true
        });

        context.waitFor(["pageBuilder", "formBuilder"], () => {
            tester.pageBuilder = true;
            tester.formBuilder = true;
        });

        context.pageBuilder = {
            loaded: true
        };
        context.formBuilder = {
            loaded: true
        };

        expect(context.pageBuilder).toEqual({
            loaded: true
        });
        expect(context.formBuilder).toEqual({
            loaded: true
        });
    });
});
