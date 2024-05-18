import { middleware, MiddlewareCallable as BaseMiddlewareCallable } from "~/utils/middleware";

interface MiddlewareCallable extends BaseMiddlewareCallable {
    calls: number;
}

const createFunctions = () => {
    const firstFunction: MiddlewareCallable = async (input, next) => {
        const output = await next();
        firstFunction.calls++;
        return {
            ...output,
            first: "yes"
        };
    };

    firstFunction.calls = 0;

    const secondFunction: MiddlewareCallable = async (input, next) => {
        const output = await next();
        console.log("secondFunction", output);
        secondFunction.calls++;
        return {
            ...output,
            second: "yes"
        };
    };
    secondFunction.calls = 0;

    const thirdFunction: MiddlewareCallable = async (input, next) => {
        const output = await next();
        console.log("thirdFunction", output);
        thirdFunction.calls++;
        return {
            ...output,
            third: "yes"
        };
    };
    thirdFunction.calls = 0;

    return {
        firstFunction,
        secondFunction,
        thirdFunction
    };
};

describe("middleware", () => {
    it.skip("should execute a single function", async () => {
        const { firstFunction } = createFunctions();

        const exec = middleware([firstFunction]);

        const firstResult = await exec({});
        expect(firstResult).toEqual({
            first: "yes"
        });
        expect(firstFunction.calls).toBe(1);

        const secondResult = await exec({});
        expect(secondResult).toEqual({
            first: "yes"
        });
        expect(firstFunction.calls).toBe(2);

        const thirdResult = await exec({});
        expect(thirdResult).toEqual({
            first: "yes"
        });
        expect(firstFunction.calls).toBe(3);
    });

    it.skip("should execute all functions", async () => {
        const { firstFunction, secondFunction, thirdFunction } = createFunctions();

        const exec = middleware([firstFunction, secondFunction, thirdFunction]);

        const firstResult = await exec({});
        expect(firstResult).toEqual({
            first: "yes",
            second: "yes",
            third: "yes"
        });

        expect(firstFunction.calls).toBe(1);
        expect(secondFunction.calls).toBe(1);
        expect(thirdFunction.calls).toBe(1);

        const secondResult = await exec({});
        expect(secondResult).toEqual({
            first: "yes",
            second: "yes",
            third: "yes"
        });

        expect(firstFunction.calls).toBe(2);
        expect(secondFunction.calls).toBe(2);
        expect(thirdFunction.calls).toBe(2);
    });

    it("should return empty response as there are no functions to execute", async () => {
        const exec = middleware([]);

        const result = await exec({});

        expect(result).toEqual({});
    });
});
