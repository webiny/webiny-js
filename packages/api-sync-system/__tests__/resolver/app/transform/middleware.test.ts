import { middleware } from "~/resolver/app/transform/middleware.js";

describe("middleware", () => {
    it("should not have any middlewares to call - return default value", async () => {
        const runner = middleware([]);

        const result = await runner(
            {},
            {
                default: true
            }
        );

        expect(result).toEqual({
            default: true
        });
    });

    it("should call a middleware", async () => {
        console.log = jest.fn();

        const runner = middleware([
            async (input, next) => {
                const result = await next();
                console.log({
                    result
                });
                return {
                    first: true
                };
            }
        ]);

        const result = await runner(
            {},
            {
                default: true
            }
        );

        expect(console.log).toHaveBeenCalledWith({
            result: {
                default: true
            }
        });

        expect(result).toEqual({
            first: true
        });
    });

    it("should it should not be possible to call next() multiple times", async () => {
        const runner = middleware([
            async (_, next) => {
                await next();
                await next();
                return {};
            }
        ]);

        await expect(
            runner(
                {},
                {
                    default: true
                }
            )
        ).rejects.toThrow("next() called multiple times");
    });
});
