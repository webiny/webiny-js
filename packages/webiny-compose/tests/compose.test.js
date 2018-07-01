import compose from "webiny-compose";

describe("middleware composition test", () => {
    test("should return a new function", () => {
        const middleware = compose([]);
        expect(typeof middleware).toBe("function");
    });

    test("should modify params object", async () => {
        const middleware = compose([
            (params, next) => {
                params.key = "value";
                params.key2 = "value2";
                next();
            }
        ]);

        const params = {};
        await middleware(params);

        expect(params["key"]).toBe("value");
        expect(params["key2"]).toBe("value2");
    });

    test("should execute all middleware functions", async () => {
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

        expect(params["key"]).toBe("value");
        expect(params["key2"]).toBe("value2");
    });

    test("should finish execution when 'finish' is called and return a value", async () => {
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
        expect(result).toEqual(100);
        expect("key2" in params).toBeFalsy();
    });

    test("should abort when an error is thrown", async () => {
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
            expect(e.message).toEqual("Abort!");
        }
        expect("key2" in params).toBeFalsy();
    });
});
