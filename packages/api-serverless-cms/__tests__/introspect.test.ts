import { useGraphQlHandler } from "./handlers/graphQlHandler";

describe("introspect", () => {
    it("should properly introspect the /graphql endpoint", async () => {
        const { introspect } = useGraphQlHandler({
            path: "/graphql"
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

    it("should properly introspect the /cms/en-US/manage endpoint", async () => {
        const { introspect } = useGraphQlHandler({
            path: "/cms/manage/en-US"
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

    it("should properly introspect the /cms/en-US/preview endpoint", async () => {
        const { introspect } = useGraphQlHandler({
            path: "/cms/preview/en-US"
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

    it("should properly introspect the /cms/en-US/read endpoint", async () => {
        const { introspect } = useGraphQlHandler({
            path: "/cms/read/en-US"
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
