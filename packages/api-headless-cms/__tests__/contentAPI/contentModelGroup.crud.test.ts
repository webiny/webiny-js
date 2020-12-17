import { identity, createInitialAliasEnvironment, createInitialEnvironment } from "../utils/helpers";
import { toSlug } from "@webiny/api-headless-cms/utils";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";

enum TestHelperEnum {
    MODELS_AMOUNT = 3,
    PREFIX = "contentModelGroup",
    SUFFIX = "UPDATED"
}

const createContentModelGroupPrefix = (position: number) => {
    return `${TestHelperEnum.PREFIX}${position}`;
};

type CreateContentModelGroupModelCallableArgsType = {
    prefix: string;
    suffix?: string;
};
const createContentModelGroupData = ({
    prefix,
    suffix
}: CreateContentModelGroupModelCallableArgsType) => {
    const append = suffix || "";
    return {
        name: `${prefix}name${append}`,
        slug: toSlug(`${prefix}slug`),
        description: `${prefix}description${append}`,
        icon: `${prefix}icon${append}`
    };
};

describe("Content model group crud test", () => {
    const {
        getContentModelGroupQuery,
        listContentModelGroupsQuery,
        createContentModelGroupMutation,
        updateContentModelGroupMutation,
        deleteContentModelGroupMutation,
        documentClient
    } = useContentGqlHandler({ path: "manage/production/en-us" });

    beforeEach(async () => {
        const env = await createInitialEnvironment(documentClient);
        await createInitialAliasEnvironment(documentClient, env);
    });

    test("content model group create, read, update, delete and list all at once", async () => {
        const updatedContentModelGroups = [];
        const prefixes = Array.from(Array(TestHelperEnum.MODELS_AMOUNT).keys()).map(prefix => {
            return createContentModelGroupPrefix(prefix);
        });

        for (const prefix of prefixes) {
            const modelData = createContentModelGroupData({ prefix });

            const [response] = await createContentModelGroupMutation({
                data: modelData
            });

            expect(response).toMatchObject({
                data: {
                    createContentModelGroup: {
                        data: {
                            id: /([a-zA-Z0-9]+)/,
                            ...modelData,
                            createdOn: /^20/,
                            changedOn: null,
                            createdBy: identity
                        },
                        error: null
                    }
                }
            });

            const {
                id: groupId,
                createdOn,
                changedOn
            } = response.data.createContentModelGroup.data;

            const [getResponse] = await getContentModelGroupQuery({
                id: groupId
            });

            expect(getResponse).toEqual({
                data: {
                    getContentModelGroup: {
                        data: {
                            id: groupId,
                            ...modelData,
                            createdOn,
                            changedOn: changedOn,
                            createdBy: identity
                        },
                        error: null
                    }
                }
            });

            const updatedModelData = createContentModelGroupData({
                prefix,
                suffix: TestHelperEnum.SUFFIX as string
            });

            const [updateResponse] = await updateContentModelGroupMutation({
                id: groupId,
                data: updatedModelData
            });

            expect(updateResponse).toMatchObject({
                data: {
                    updateContentModelGroup: {
                        data: {
                            id: groupId,
                            createdOn,
                            ...updatedModelData,
                            changedOn: /^20/,
                            createdBy: identity
                        },
                        error: null
                    }
                }
            });
            updatedContentModelGroups.push(updateResponse.data.updateContentModelGroup.data);
        }
        const [listResponse] = await listContentModelGroupsQuery();

        expect(listResponse).toEqual({
            data: {
                listContentModelGroups: {
                    data: updatedContentModelGroups,
                    error: null
                }
            }
        });
        expect(listResponse.data.listContentModelGroups.data).toHaveLength(
            TestHelperEnum.MODELS_AMOUNT
        );

        for (const { id } of updatedContentModelGroups) {
            const [deleteResponse] = await deleteContentModelGroupMutation({
                id
            });
            expect(deleteResponse).toEqual({
                data: {
                    deleteContentModelGroup: {
                        data: true,
                        error: null
                    }
                }
            });
        }

        const [afterDeleteListResponse] = await listContentModelGroupsQuery();
        expect(afterDeleteListResponse.data.listContentModelGroups.data).toHaveLength(0);
        expect(afterDeleteListResponse).toEqual({
            data: {
                listContentModelGroups: {
                    data: [],
                    error: null
                }
            }
        });
    });

    test("error when getting non-existing content model group", async () => {
        const [response] = await getContentModelGroupQuery({
            id: "nonExistingId"
        });
        expect(response).toEqual({
            data: {
                getContentModelGroup: {
                    data: null,
                    error: {
                        message: `CMS Content model group "nonExistingId" not found.`,
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    test("error when trying to update non-existing content model group", async () => {
        const [response] = await updateContentModelGroupMutation({
            id: "nonExistingIdUpdate",
            data: {}
        });
        expect(response).toEqual({
            data: {
                updateContentModelGroup: {
                    data: null,
                    error: {
                        message: `CMS Content model group "nonExistingIdUpdate" not found.`,
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    test("error when trying to delete non-existing content model group", async () => {
        const [response] = await deleteContentModelGroupMutation({
            id: "nonExistingIdDelete"
        });
        expect(response).toEqual({
            data: {
                deleteContentModelGroup: {
                    data: null,
                    error: {
                        message: `CMS Content model group "nonExistingIdDelete" not found.`,
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    test("error when trying to create a content model group with incomplete data", async () => {
        const [nameResponse] = await createContentModelGroupMutation({
            data: {
                slug: "slug",
                description: `description`,
                icon: `icon`
            }
        });
        expect(nameResponse).toEqual({
            data: {
                createContentModelGroup: {
                    data: null,
                    error: {
                        message: `Validation failed.`,
                        code: "CREATE_CONTENT_MODEL_GROUP_FAILED",
                        data: null
                    }
                }
            }
        });

        const [iconResponse] = await createContentModelGroupMutation({
            data: {
                name: "name",
                slug: "slug",
                description: `description`
            }
        });

        expect(iconResponse).toEqual({
            data: {
                createContentModelGroup: {
                    data: null,
                    error: {
                        message: `Validation failed.`,
                        code: "CREATE_CONTENT_MODEL_GROUP_FAILED",
                        data: null
                    }
                }
            }
        });
    });

    test("error when trying to create a new content model group with no name or slug", async () => {
        const [response] = await createContentModelGroupMutation({
            data: {
                description: "description"
            }
        });
        expect(response).toEqual({
            data: {
                createContentModelGroup: {
                    data: null,
                    error: {
                        message: `Validation failed.`,
                        code: "CREATE_CONTENT_MODEL_GROUP_FAILED",
                        data: null
                    }
                }
            }
        });
    });

    test("error when trying to create a new content model group with same slug as existing one in the database", async () => {
        await createContentModelGroupMutation({
            data: {
                name: "content model group",
                description: "description",
                icon: "icon"
            }
        });

        const [response] = await createContentModelGroupMutation({
            data: {
                name: "content model group",
                slug: "content-model-group",
                description: "description",
                icon: "icon"
            }
        });

        expect(response).toEqual({
            data: {
                createContentModelGroup: {
                    data: null,
                    error: {
                        message: `Content model group with the slug "content-model-group" already exists.`,
                        code: "CREATE_CONTENT_MODEL_GROUP_FAILED",
                        data: null
                    }
                }
            }
        });
    });
});
