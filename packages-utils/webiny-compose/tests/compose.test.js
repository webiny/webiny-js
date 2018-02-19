// @flow
import { assert } from "chai";
import compose from "./../lib";

describe("middleware composition test", () => {
    it("should return a new function", () => {
        const middleware = compose([]);
        assert.isFunction(middleware);
    });

    it("should modify params object", async () => {
        const middleware = compose([
            (params, next) => {
                params.key = "value";
                params.key2 = "value2";
                next();
            }
        ]);

        const params = {};
        await middleware(params);

        assert.propertyVal(params, "key", "value");
        assert.propertyVal(params, "key2", "value2");
    });

    it("should execute all middleware functions", async () => {
        const middleware = compose([
            (params, next) => {
                params.key = "value";
                next();
            },
            (params, next) => {
                params.key2 = "value2";
                next();
            }
        ]);

        const params = {};
        await middleware(params);

        assert.propertyVal(params, "key", "value");
        assert.propertyVal(params, "key2", "value2");
    });

    it("should finish execution when 'finish' is called and return a value", async () => {
        const middleware = compose([
            (params, next, finish) => {
                finish(100);
            },
            (params, next) => {
                params.key2 = "value2";
                next();
            }
        ]);

        const params = {};
        const result = await middleware(params);
        assert.equal(result, 100);
        assert.notProperty(params, "key2");
    });

    it("should abort when an error is thrown", async () => {
        const middleware = compose([
            () => {
                throw new Error("Abort!");
            },
            (params, next) => {
                params.key2 = "value2";
                next();
            }
        ]);

        const params = {};
        try {
            await middleware(params);
        } catch (e) {
            assert.equal(e.message, "Abort!");
        }
        assert.notProperty(params, "key2");
    });
});
