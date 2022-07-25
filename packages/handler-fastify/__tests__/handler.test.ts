import { createHandler, EventPlugin } from "~/index";

const eventPlugin = new EventPlugin(async payload => {
    if (payload.test === true) {
        return {
            testing: true
        };
    } else if (payload.fn === true) {
        return {
            fn: () => {
                return 1234;
            }
        };
    }
    throw new Error("Error testing!");
});

describe("handler fastify", () => {
    it("should fire event and it must return required object", async () => {
        const handler = createHandler({
            plugins: [eventPlugin]
        });

        const result = await handler({
            test: true
        });

        expect(result).toEqual({
            testing: true
        });
    });

    it("should fire event and it must return required function", async () => {
        const handler = createHandler({
            plugins: [eventPlugin]
        });

        const result = await handler({
            fn: true
        });

        expect(result).toEqual({
            fn: expect.any(Function)
        });

        const fnResult = result.fn();
        expect(fnResult).toEqual(1234);
    });

    it("should fire event and it must return an error", async () => {
        const handler = createHandler({
            plugins: [eventPlugin]
        });

        const result = await handler();

        expect(result).toBeInstanceOf(Error);
    });
});
