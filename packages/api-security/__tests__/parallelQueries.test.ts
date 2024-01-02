import useGqlHandler from "./useGqlHandler";
import { PARALLEL_QUERY, withoutAuthorizationPlugin } from "./graphql/parallelQueries";

describe("Security Parallel Queries", () => {
    const { install, invoke } = useGqlHandler({ plugins: [withoutAuthorizationPlugin] });

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
                        code: "SECURITY_NOT_AUTHORIZED"
                    }
                }
            }
        });
    });
});
