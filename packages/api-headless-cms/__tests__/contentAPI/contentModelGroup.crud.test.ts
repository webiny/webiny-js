import { identity } from "../utils/helpers";
import { toSlug } from "~/utils/toSlug";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";

enum TestHelperEnum {
    MODELS_AMOUNT = 3,
    PREFIX = "contentModelGroup",
    SUFFIX = "UPDATED"
}

const createContentModelGroupPrefix = (position: number) => {
    return `${TestHelperEnum.PREFIX}${position}`;
};

interface CreateContentModelGroupModelCallableArgs {
    prefix: string;
    suffix?: string;
}
const createContentModelGroupData = ({
    prefix,
    suffix
}: CreateContentModelGroupModelCallableArgs) => {
    const append = suffix || "";
    return {
        name: `${prefix}name${append}`,
        slug: toSlug(`${prefix}slug`),
        description: `${prefix}description${append}`,
        icon: `${prefix}icon${append}`
    };
};

const createPermissions = (groups: string[]) => [
    {
        name: "cms.settings"
    },
    {
        name: "cms.contentModelGroup",
        rwd: "rwd",
        groups: groups ? { "en-US": groups } : undefined
    },
    {
        name: "cms.endpoint.read"
    },
    {
        name: "cms.endpoint.manage"
    },
    {
        name: "cms.endpoint.preview"
    },
    {
        name: "content.i18n",
        locales: ["en-US"]
    }
];

describe("Cms Group crud test", () => {
    const {
        getContentModelGroupQuery,
        listContentModelGroupsQuery,
        createContentModelGroupMutation,
        updateContentModelGroupMutation,
        deleteContentModelGroupMutation
    } = useGraphQLHandler({ path: "manage/en-us" });

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

            expect(response).toEqual({
                data: {
                    createContentModelGroup: {
                        data: {
                            id: expect.any(String),
                            ...modelData,
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: identity
                        },
                        error: null
                    }
                }
            });

            const { id: groupId, createdOn, savedOn } = response.data.createContentModelGroup.data;

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
                            savedOn: savedOn,
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

            expect(updateResponse).toEqual({
                data: {
                    updateContentModelGroup: {
                        data: {
                            id: groupId,
                            createdOn,
                            ...updatedModelData,
                            savedOn: expect.stringMatching(/^20/),
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
                        message: `Cms Group "nonExistingId" was not found!`,
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
            data: {
                name: "test",
                icon: "test"
            }
        });
        expect(response).toEqual({
            data: {
                updateContentModelGroup: {
                    data: null,
                    error: {
                        message: `Cms Group "nonExistingIdUpdate" was not found!`,
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
                        message: `Cms Group "nonExistingIdDelete" was not found!`,
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
                name: "",
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
                        code: "VALIDATION_FAILED_INVALID_FIELDS",
                        data: expect.any(Object)
                    }
                }
            }
        });

        const [iconResponse] = await createContentModelGroupMutation({
            data: {
                name: "name",
                slug: "slug",
                description: `description`,
                icon: ""
            }
        });

        expect(iconResponse).toEqual({
            data: {
                createContentModelGroup: {
                    data: null,
                    error: {
                        message: `Validation failed.`,
                        code: "VALIDATION_FAILED_INVALID_FIELDS",
                        data: expect.any(Object)
                    }
                }
            }
        });
    });

    test("error when trying to create a new content model group with no name or slug", async () => {
        const [response] = await createContentModelGroupMutation({
            data: {
                name: "",
                description: "description",
                icon: ""
            }
        });
        expect(response).toEqual({
            data: {
                createContentModelGroup: {
                    data: null,
                    error: {
                        message: `Validation failed.`,
                        code: "VALIDATION_FAILED_INVALID_FIELDS",
                        data: expect.any(Object)
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
                        message: `Cms Group with the slug "content-model-group" already exists.`,
                        code: "SLUG_ALREADY_EXISTS",
                        data: expect.any(Object)
                    }
                }
            }
        });
    });

    test("list specific content model groups", async () => {
        // Create few content model groups
        const prefixes = Array.from(Array(TestHelperEnum.MODELS_AMOUNT).keys()).map(prefix => {
            return createContentModelGroupPrefix(prefix);
        });
        const groups: string[] = [];
        for (const prefix of prefixes) {
            const modelData = createContentModelGroupData({ prefix });

            const [response] = await createContentModelGroupMutation({
                data: modelData
            });

            expect(response).toEqual({
                data: {
                    createContentModelGroup: {
                        data: {
                            id: expect.any(String),
                            ...modelData,
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: identity
                        },
                        error: null
                    }
                }
            });

            groups.push(response.data.createContentModelGroup.data.id);
        }

        // Create listGroups query with permission for only specific groups
        const { listContentModelGroupsQuery: listGroups } = useGraphQLHandler({
            path: "manage/en-us",
            permissions: createPermissions([groups[0]])
        });

        const [response] = await listGroups();
        // Should only return valid content model group
        expect(response.data.listContentModelGroups.data.length).toEqual(1);
        expect(response.data.listContentModelGroups.data[0].id).toEqual(groups[0]);
    });
});
