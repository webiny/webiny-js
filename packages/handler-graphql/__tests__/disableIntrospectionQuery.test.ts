import useGqlHandler from "./useGqlHandler";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { booksCrudPlugin, booksSchema } from "~tests/mocks/booksSchema";

const disableIntrospectionPlugin = new BeforeHandlerPlugin(async context => {
    // Check in the context.request.body if there is an introspection query.
    const body = context.request.body as unknown as Record<string, any>;
    if (!body?.query) {
        return;
    } else if ((body.query as string).includes("__schema") === false) {
        return;
    }

    // Then you can end the request with reply hijacking.
    context.reply
        .send({
            message: "Forbidden to execute introspection queries."
        })
        .status(403)
        .hijack();
});
describe("disable introspection query", () => {
    it("should not allow to run introspection query", async () => {
        const { introspect: enabledIntrospect } = useGqlHandler({
            plugins: [booksSchema]
        });

        const [enabledIntrospectResponse] = await enabledIntrospect();

        expect(enabledIntrospectResponse).toMatchObject({
            data: {
                __schema: expect.any(Object)
            }
        });

        const { introspect: disabledIntrospect, invoke: disabledIntrospectInvoke } = useGqlHandler({
            plugins: [booksCrudPlugin, booksSchema, disableIntrospectionPlugin]
        });

        const [response, rawResponse] = await disabledIntrospect();

        expect(rawResponse).toMatchObject({
            statusCode: 403
        });

        expect(response).toEqual({
            message: "Forbidden to execute introspection queries."
        });

        const [booksResponse] = await disabledIntrospectInvoke({
            body: { query: `{ books { name } }` }
        });
        expect(booksResponse.errors).toBeFalsy();
        expect(booksResponse.data.books.length).toBe(2);
    });
});
