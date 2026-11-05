import { describe, expect, test } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";

const QUERY = /* GraphQL */ `
    {
        listContentModelGroups {
            data {
                id
            }
        }
    }
`;

describe("CMS GraphQL request content type", () => {
    test.each(["manage", "read", "preview"])(
        "should refuse a text/plain request on the %s API with a 415",
        async path => {
            const { invoke } = useGraphQLHandler({ path });

            const [body, response] = await invoke({
                body: { query: QUERY },
                headers: { ["content-type"]: "text/plain;charset=UTF-8" }
            });

            expect(response.statusCode).toBe(415);
            expect(body).toMatchObject({
                data: null,
                error: { code: "GRAPHQL_UNSUPPORTED_MEDIA_TYPE" }
            });
        }
    );

    test("should accept an application/json request on the manage API", async () => {
        const { invoke } = useGraphQLHandler({ path: "manage" });

        const [body, response] = await invoke({
            body: { query: QUERY },
            headers: { ["content-type"]: "application/json; charset=utf-8" }
        });

        expect(response.statusCode).toBe(200);
        expect(body.data.listContentModelGroups.data).toBeInstanceOf(Array);
    });

    test("should refuse a JSON body without a query with a 400", async () => {
        const { invoke } = useGraphQLHandler({ path: "manage" });

        const [body, response] = await invoke({
            body: { notAQuery: true } as any
        });

        expect(response.statusCode).toBe(400);
        expect(body).toMatchObject({ code: "GRAPHQL_REQUEST_INVALID" });
    });
});
