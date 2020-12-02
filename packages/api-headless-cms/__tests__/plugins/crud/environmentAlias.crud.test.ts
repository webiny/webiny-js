import { useGqlHandler } from "./useGqlHandler";
import {
    createEnvironmentTestPartitionKey,
    fetchInitialEnvironment,
    getInitialEnvironment,
    getInitialEnvironmentId
} from "./helpers";
import { CmsEnvironmentType } from "@webiny/api-headless-cms/types";

enum TestHelperEnum {
    MODELS_AMOUNT = 3,
    PREFIX = "alias",
    SUFFIX = "UPDATED",
    USER_ID = "1234567890",
    USER_NAME = "userName123"
}
const createEnvironmentAliasPrefix = position => {
    return `${TestHelperEnum.PREFIX}${position}`;
};
type CreateEnvironmentAliasModelCallableArgsType = {
    prefix: string;
    environment: CmsEnvironmentType;
    suffix?: string;
};
const createEnvironmentAliasModel = ({
    prefix,
    environment,
    suffix
}: CreateEnvironmentAliasModelCallableArgsType) => {
    const append = suffix || "";
    return {
        name: `${prefix}name${append}`,
        slug: `${prefix}slug${append}`,
        description: `${prefix}description${append}`,
        environment: environment.id
    };
};

const createMatchableUpdatedEnvironmentAliasModel = (
    position: number,
    environment: CmsEnvironmentType
) => {
    const initialModel = createEnvironmentAliasModel({
        prefix: createEnvironmentAliasPrefix(position),
        environment,
        suffix: TestHelperEnum.SUFFIX as string
    });

    return {
        ...initialModel,
        id: /([a-z0-9A-Z]+)/,
        createdOn: /^20/,
        changedOn: /^20/,
        environment: getInitialEnvironment(),
        createdBy: {
            id: TestHelperEnum.USER_ID,
            name: TestHelperEnum.USER_NAME
        }
    };
};

describe("Environment crud test", () => {
    const {
        createEnvironmentAliasMutation,
        getEnvironmentAliasQuery,
        updateEnvironmentAliasMutation,
        deleteEnvironmentAliasMutation,
        listEnvironmentAliasesQuery,
        documentClient
    } = useGqlHandler();

    beforeAll(async () => {
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

    test("environment create, read, update, delete and list all at once", async () => {
        const environment = await fetchInitialEnvironment(documentClient);

        const createdEnvironmentAliasIdList: string[] = [];
        const prefixes = Array.from(Array(TestHelperEnum.MODELS_AMOUNT).keys()).map(prefix => {
            return createEnvironmentAliasPrefix(prefix);
        });
        for (const prefix of prefixes) {
            const modelData = createEnvironmentAliasModel({ prefix, environment });
            const [createResponse] = await createEnvironmentAliasMutation({
                data: modelData
            });
            expect(createResponse).toMatchObject({
                data: {
                    cms: {
                        createEnvironmentAlias: {
                            data: {
                                id: /([a-zA-Z0-9]+)/,
                                ...modelData,
                                environment: getInitialEnvironment(),
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
            const createdEnvironmentAliasId =
                createResponse.data.cms.createEnvironmentAlias.data.id;
            createdEnvironmentAliasIdList.push(createdEnvironmentAliasId);

            const [getResponse] = await getEnvironmentAliasQuery({
                id: createdEnvironmentAliasId
            });

            expect(getResponse).toMatchObject({
                data: {
                    cms: {
                        getEnvironmentAlias: {
                            data: {
                                id: /([a-zA-Z0-9]+)/,
                                ...modelData,
                                environment: getInitialEnvironment(),
                                createdBy: {
                                    id: TestHelperEnum.USER_ID,
                                    name: TestHelperEnum.USER_NAME
                                },
                                createdOn: /^20/,
                                changedOn: null
                            },
                            error: null
                        }
                    }
                }
            });

            const updatedModelData = createEnvironmentAliasModel({
                prefix,
                environment,
                suffix: TestHelperEnum.SUFFIX as string
            });

            const [updateResponse] = await updateEnvironmentAliasMutation({
                id: createdEnvironmentAliasId,
                data: updatedModelData
            });
            expect(updateResponse).toMatchObject({
                data: {
                    cms: {
                        updateEnvironmentAlias: {
                            data: {
                                id: /^20/,
                                ...updatedModelData,
                                environment: getInitialEnvironment(),
                                createdBy: {
                                    id: TestHelperEnum.USER_ID,
                                    name: TestHelperEnum.USER_NAME
                                },
                                createdOn: /^20/,
                                changedOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });
        }

        const [listResponse] = await listEnvironmentAliasesQuery();
        expect(listResponse.data.cms.listEnvironmentAliases.data).toHaveLength(
            TestHelperEnum.MODELS_AMOUNT
        );
        expect(listResponse).toMatchObject({
            data: {
                cms: {
                    listEnvironmentAliases: {
                        data: [
                            createMatchableUpdatedEnvironmentAliasModel(0, environment),
                            createMatchableUpdatedEnvironmentAliasModel(1, environment),
                            createMatchableUpdatedEnvironmentAliasModel(2, environment)
                        ],
                        error: null
                    }
                }
            }
        });

        for (const id of createdEnvironmentAliasIdList) {
            const [deleteResponse] = await deleteEnvironmentAliasMutation({
                id
            });
            expect(deleteResponse).toMatchObject({
                data: {
                    cms: {
                        deleteEnvironmentAlias: {
                            data: true,
                            error: null
                        }
                    }
                }
            });
        }

        const [afterDeleteListResponse] = await listEnvironmentAliasesQuery();
        expect(afterDeleteListResponse.data.cms.listEnvironmentAliases.data).toHaveLength(0);
        expect(afterDeleteListResponse).toEqual({
            data: {
                cms: {
                    listEnvironmentAliases: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });
});
