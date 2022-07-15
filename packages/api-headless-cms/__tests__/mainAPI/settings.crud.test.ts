import { createIdentity } from "../utils/helpers";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";

describe("Settings crud test", () => {
    const manageOpts = {
        path: "manage/en-US"
    };

    const { introspect, installMutation } = useGraphQLHandler({
        mockLocales: false
    });

    const { isInstalledQuery, installMutation: installMutationNoPermission } = useGraphQLHandler({
        permissions: [],
        mockLocales: false
    });

    const { listContentModelGroupsQuery } = useGraphQLHandler(manageOpts);

    test("graphql schema must not produce error", async () => {
        const [response] = await introspect();

        expect(response).toEqual({
            data: {
                __schema: expect.any(Object)
            }
        });
    });

    test("cms is not installed yet", async () => {
        const [response] = await isInstalledQuery();
        expect(response).toEqual({
            data: {
                cms: {
                    version: null
                }
            }
        });
    });

    test("cms is being installed", async () => {
        const [installResponse] = await installMutation();

        expect(installResponse).toEqual({
            data: {
                cms: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [response] = await isInstalledQuery();
        expect(response).toEqual({
            data: {
                cms: {
                    version: expect.any(String)
                }
            }
        });

        const [listContentModelGroupsResponse] = await listContentModelGroupsQuery();

        expect(listContentModelGroupsResponse).toEqual({
            data: {
                listContentModelGroups: {
                    data: [
                        {
                            id: expect.any(String),
                            createdBy: createIdentity(),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            description: "A generic content model group",
                            icon: "fas/star",
                            name: "Ungrouped",
                            slug: "ungrouped"
                        }
                    ],
                    error: null
                }
            }
        });
    });

    test("cms is already installed", async () => {
        await installMutation();

        const [response] = await installMutation();
        expect(response).toEqual({
            data: {
                cms: {
                    install: {
                        data: null,
                        error: {
                            message: "CMS is already installed.",
                            code: "CMS_INSTALLATION_ERROR",
                            data: null
                        }
                    }
                }
            }
        });
    });

    test("cms install", async () => {
        const [response] = await installMutation();
        expect(response).toEqual({
            data: {
                cms: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [isInstalledResponse] = await isInstalledQuery();
        expect(isInstalledResponse).toEqual({
            data: {
                cms: {
                    version: expect.any(String)
                }
            }
        });
    });

    test("should not install due to lack of permissions", async () => {
        const [response] = await installMutationNoPermission();

        expect(response).toEqual({
            data: {
                cms: {
                    install: {
                        data: null,
                        error: {
                            code: "CMS_INSTALLATION_CONTENT_MODEL_GROUP_ERROR",
                            message: "Not authorized!",
                            data: {
                                group: {
                                    description: "A generic content model group",
                                    icon: "fas/star",
                                    name: "Ungrouped",
                                    slug: "ungrouped"
                                }
                            }
                        }
                    }
                }
            }
        });
    });
});
