import { useAdminGqlHandler } from "../utils/useAdminGqlHandler";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { createIdentity } from "../utils/helpers";

describe("Settings crud test", () => {
    const manageOpts = {
        path: "manage/en-US"
    };

    const { listContentModelGroupsQuery } = useContentGqlHandler({
        ...manageOpts
    });

    const { installMutation } = useAdminGqlHandler({
        ...manageOpts
    });

    const { isInstalledQuery, installMutation: installMutationNoPermission } = useAdminGqlHandler({
        ...manageOpts,
        permissions: []
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
        await installMutation();

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
