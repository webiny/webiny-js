import { useGraphQlHandler } from "./handlers/graphQlHandler";
import { PathType } from "~tests/handlers/types";

jest.setTimeout(90000);

type Option = ["on" | "off", PathType];

describe("introspect", () => {
    const options: Option[] = [
        ["on", "/graphql"],
        ["on", "/cms/manage/en-US"],
        ["on", "/cms/preview/en-US"],
        ["on", "/cms/read/en-US"],
        ["off", "/graphql"],
        ["off", "/cms/manage/en-US"],
        ["off", "/cms/preview/en-US"],
        ["off", "/cms/read/en-US"]
    ];

    beforeEach(async () => {
        process.env.S3_BUCKET = "a-mock-s3-bucket-which-does-not-exist";
    });

    it.each(options)(
        "should properly introspect, with wcp %s, the %s endpoint",
        async (wcp, path) => {
            const { introspect, login } = useGraphQlHandler({
                path,
                features: wcp === "on" ? true : false
            });

            login();

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
        }
    );
});
