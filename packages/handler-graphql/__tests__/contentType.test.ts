import { describe, test, expect } from "vitest";
import useGqlHandler from "./useGqlHandler";
import { booksSchemaPlugin, booksCrudPlugin } from "~tests/mocks/booksSchema";

const QUERY = { query: `{ books { name } }` };

const UNSUPPORTED_MEDIA_TYPE = {
    data: null,
    error: {
        code: "GRAPHQL_UNSUPPORTED_MEDIA_TYPE",
        message: 'GraphQL requests must be sent with "Content-Type: application/json".',
        data: null
    }
};

describe("GraphQL request content type", () => {
    test.each(["application/json", "application/json; charset=utf-8", "Application/JSON"])(
        "should accept %s",
        async contentType => {
            const { invoke } = useGqlHandler({ plugins: [booksSchemaPlugin, booksCrudPlugin] });
            const [body, response] = await invoke({
                body: QUERY,
                headers: { ["Content-Type"]: contentType }
            });

            expect(response.statusCode).toBe(200);
            expect(body.data.books.length).toBeGreaterThan(0);
        }
    );

    test.each(["text/plain", "text/plain;charset=UTF-8"])(
        "should refuse %s with a 415",
        async contentType => {
            const { invoke } = useGqlHandler({ plugins: [booksSchemaPlugin, booksCrudPlugin] });
            const [body, response] = await invoke({
                body: QUERY,
                headers: { ["Content-Type"]: contentType }
            });

            expect(response.statusCode).toBe(415);
            expect(body).toEqual(UNSUPPORTED_MEDIA_TYPE);
        }
    );

    test("should refuse content types without a body parser with a 415", async () => {
        const { invoke } = useGqlHandler({ plugins: [booksSchemaPlugin, booksCrudPlugin] });
        const [body, response] = await invoke({
            body: QUERY,
            headers: { ["Content-Type"]: "application/graphql" }
        });

        // Fastify refuses these before the GraphQL route runs.
        expect(response.statusCode).toBe(415);
        expect(body).toMatchObject({ code: "FST_ERR_CTP_INVALID_MEDIA_TYPE" });
    });

    test("should not run a query sent without a Content-Type header", async () => {
        const { invoke } = useGqlHandler({ plugins: [booksSchemaPlugin, booksCrudPlugin] });
        const [body, response] = await invoke({
            body: QUERY,
            headers: { ["Content-Type"]: undefined as unknown as string }
        });

        // `handler-aws` defaults a missing content type to JSON and drops the body.
        expect(response.statusCode).toBe(400);
        expect(body).toMatchObject({ code: "GRAPHQL_REQUEST_INVALID" });
        expect(body.data?.books).toBeUndefined();
    });

    test("should refuse a JSON body without a query with a 400", async () => {
        const { invoke } = useGqlHandler({ plugins: [booksSchemaPlugin, booksCrudPlugin] });
        const [body, response] = await invoke({ body: { notAQuery: true } });

        expect(response.statusCode).toBe(400);
        expect(body).toMatchObject({ code: "GRAPHQL_REQUEST_INVALID" });
    });
});
