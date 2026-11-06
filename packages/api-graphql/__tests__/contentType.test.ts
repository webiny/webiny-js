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

const setup = [booksCrudPlugin, booksSchemaPlugin];

describe("GraphQL request content type", () => {
    test.each(["application/json", "application/json; charset=utf-8", "Application/JSON"])(
        "should accept %s",
        async contentType => {
            const { invoke } = useGqlHandler({ setup });
            const [body, response] = await invoke({
                body: QUERY,
                headers: { "content-type": contentType }
            });

            expect(response.statusCode).toBe(200);
            expect(body.data.books.length).toBeGreaterThan(0);
        }
    );

    test.each(["text/plain", "text/plain;charset=UTF-8", "application/x-www-form-urlencoded"])(
        "should refuse %s with a 415",
        async contentType => {
            const { invoke } = useGqlHandler({ setup });
            const [body, response] = await invoke({
                body: JSON.stringify(QUERY),
                headers: { "content-type": contentType }
            });

            expect(response.statusCode).toBe(415);
            expect(response.headers["Cache-Control"]).toBe("no-store");
            expect(body).toEqual(UNSUPPORTED_MEDIA_TYPE);
        }
    );

    test("should refuse a request without a content type with a 415", async () => {
        const { invoke } = useGqlHandler({ setup });
        const [body, response] = await invoke({
            body: QUERY,
            headers: { "content-type": undefined }
        });

        expect(response.statusCode).toBe(415);
        expect(body).toEqual(UNSUPPORTED_MEDIA_TYPE);
    });

    test("should refuse a JSON body without a query with a 400", async () => {
        const { invoke } = useGqlHandler({ setup });
        const [body, response] = await invoke({ body: { notAQuery: true } });

        expect(response.statusCode).toBe(400);
        expect(body).toMatchObject({ code: "GRAPHQL_REQUEST_INVALID" });
    });

    test("should refuse a string body (malformed JSON) with a 400", async () => {
        const { invoke } = useGqlHandler({ setup });
        const [body, response] = await invoke({ body: "{ not json" });

        expect(response.statusCode).toBe(400);
        expect(body).toMatchObject({ code: "GRAPHQL_REQUEST_INVALID" });
    });
});
