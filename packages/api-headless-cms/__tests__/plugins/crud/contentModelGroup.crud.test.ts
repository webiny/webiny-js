import { useGqlHandler } from "./useGqlHandler";
import {
    createEnvironmentTestPartitionKey,
    getInitialEnvironment,
    getInitialEnvironmentId
} from "./helpers";
import toSlug from "@webiny/api-headless-cms/utils/toSlug";

enum TestHelperEnum {
    MODELS_AMOUNT = 3,
    PREFIX = "contentModelGroup",
    SUFFIX = "UPDATED",
    USER_ID = "1234567890",
    USER_NAME = "userName123"
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
        slug: toSlug(`${prefix}slug${append}`),
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
    } = useGqlHandler();

    beforeEach(async () => {
        await documentClient
            .put({
                TableName: "HeadlessCms",
                Item: {
                    PK: createEnvironmentTestPartitionKey(),
                    SK: getInitialEnvironmentId(),
                    TYPE: "cms#env",
                    ...getInitialEnvironment(),
                    createdOn: new Date().toISOString()
                }
            })
            .promise();
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
                    cms: {
                        createContentModelGroup: {
                            data: {
                                id: /([a-zA-Z0-9]+)/,
                                ...modelData,
                                createdOn: /^20/,
                                changedOn: null,
                                createdBy: {
                                    id: TestHelperEnum.USER_ID,
                                    name: TestHelperEnum.USER_NAME
                                }
                            },
                            error: null
                        }
                    }
                }
            });

            const { id: groupId, createdOn } = response.data.cms.createContentModelGroup.data;

            const [getResponse] = await getContentModelGroupQuery({
                id: groupId
            });

            expect(getResponse).toEqual({
                data: {
                    cms: {
                        getContentModelGroup: {
                            data: {
                                id: groupId,
                                ...modelData,
                                createdOn,
                                changedOn: null,
                                createdBy: {
                                    id: TestHelperEnum.USER_ID,
                                    name: TestHelperEnum.USER_NAME
                                }
                            },
                            error: null
                        }
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
                    cms: {
                        updateContentModelGroup: {
                            data: {
                                id: groupId,
                                createdOn,
                                ...updatedModelData,
                                changedOn: /^20/,
                                createdBy: {
                                    id: TestHelperEnum.USER_ID,
                                    name: TestHelperEnum.USER_NAME
                                }
                            },
                            error: null
                        }
                    }
                }
            });
            updatedContentModelGroups.push(updateResponse.data.cms.updateContentModelGroup.data);
        }
        const [listResponse] = await listContentModelGroupsQuery();
        expect(listResponse.data.cms.listContentModelGroups.data).toHaveLength(
            TestHelperEnum.MODELS_AMOUNT
        );
        expect(listResponse).toEqual({
            data: {
                cms: {
                    listContentModelGroups: {
                        data: updatedContentModelGroups,
                        error: null
                    }
                }
            }
        });

        for (const { id } of updatedContentModelGroups) {
            const [deleteResponse] = await deleteContentModelGroupMutation({
                id
            });
            expect(deleteResponse).toEqual({
                data: {
                    cms: {
                        deleteContentModelGroup: {
                            data: true,
                            error: null
                        }
                    }
                }
            });
        }

        const [afterDeleteListResponse] = await listContentModelGroupsQuery();
        expect(afterDeleteListResponse.data.cms.listContentModelGroups.data).toHaveLength(0);
        expect(afterDeleteListResponse).toEqual({
            data: {
                cms: {
                    listContentModelGroups: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });
});
