import { AsyncProcessor, composeAsync } from "~/compose";

interface ValueFnParams {
    value: number;
}

interface NameFnParams extends ValueFnParams {
    name: string;
}

describe("Compose", () => {
    it("should run a single function and increase value of the input", async () => {
        const fn: AsyncProcessor<ValueFnParams> = next => {
            return ({ value }) => {
                return next({
                    value: value + 5
                });
            };
        };
        const result = await composeAsync([fn])({
            value: 5
        });

        expect(result).toEqual({
            value: 10
        });
    });

    it("should run multiple functions and increase value of the input", async () => {
        const fn: AsyncProcessor<ValueFnParams> = next => {
            return ({ value }) => {
                return next({
                    value: value + 5
                });
            };
        };
        const result = await composeAsync([fn, fn, fn])({
            value: 5
        });

        expect(result).toEqual({
            value: 20
        });
    });

    it("should run multiple functions, increase value of the input and add new output property", async () => {
        const fn: AsyncProcessor<ValueFnParams> = next => {
            return ({ value }) => {
                return next({
                    value: value + 5
                });
            };
        };

        const nameFn: AsyncProcessor<NameFnParams> = next => {
            return ({ value, name }) => {
                /**
                 * Name should not exist at this point
                 */
                if (name) {
                    throw new Error("This must never happen!");
                }

                return next({
                    value: value + 5,
                    name: "Webiny"
                });
            };
        };
        const result = await composeAsync([fn, fn, fn, nameFn] as any)({
            value: 5
        });

        expect(result).toEqual({
            value: 25,
            name: "Webiny"
        });
    });
});
