import { describe, test, expect, beforeEach } from "vitest";
import { useGqlHandler } from "../useGqlHandler";
import { PARALLEL_QUERY, withoutAuthorizationFactory } from "../graphql/parallelQueries";

describe("Security Parallel Queries", () => {
    const { install, invoke } = useGqlHandler({ plugins: [withoutAuthorizationFactory] });

    beforeEach(async () => {
        await install.install();
    });

    test("should not disable authorization in parallel queries", async () => {
        const [response] = await invoke({
            body: { query: PARALLEL_QUERY },
            // We want to simulate an anonymous user.
            headers: { authorization: "anonymous" }
        });

        expect(response.data).toEqual({
            withoutAuthorization: "YOUR DATA!",
            withAuthorization: "NOT_AUTHORIZED",
            security: {
                listApiKeys: {
                    data: null,
                    error: {
                        code: "ApiKey/NotAuthorized"
                    }
                }
            }
        });
    });
});
