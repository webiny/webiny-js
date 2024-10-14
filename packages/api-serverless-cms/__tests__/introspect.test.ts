import { useGraphQlHandler } from "./handlers/graphQlHandler";
import { PathType } from "~tests/handlers/types";

describe("introspect", () => {
    const endpoints: PathType[] = [
        "/graphql",
        "/cms/manage/en-US",
        "/cms/preview/en-US",
        "/cms/read/en-US"
    ];

    beforeEach(async () => {
        process.env.S3_BUCKET = "a-mock-s3-bucket-which-does-not-exist";
    });

    it.each(endpoints)("should properly introspect the %s endpoint", async path => {
        const { introspect } = useGraphQlHandler({
            path
        });

        const [response] = await introspect();
        expect(response).toEqual({
            data: {
                __schema: {
                    directives: expect.any(Array),
                    mutationType: {
                        name: "Mutation"
                    },
                    queryType: {
                        name: "Query"
                    },
                    subscriptionType: null,
                    types: expect.any(Array)
                }
            }
        });
    });
});
