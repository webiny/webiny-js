import { useGqlHandler } from "./useGqlHandler";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CmsEnvironmentType } from "@webiny/api-headless-cms/types";
import { createEnvironmentPk } from "@webiny/api-headless-cms/plugins/crud/partitionKeys";

enum TestHelperEnum {
    MODELS_AMOUNT = 3, // number of test models to be created
    PREFIX = "environment",
    SUFFIX = "UPDATED",
    USER_ID = "1234567890",
    USER_NAME = "userName123"
}

const createEnvironmentPrefix = position => {
    return `${TestHelperEnum.PREFIX}${position}`;
};
type CreateEnvironmentArgsType = {
    prefix: string;
    initialEnvironment: CmsEnvironmentType;
    suffix?: string;
};
const createEnvironmentModel = ({
    prefix,
    initialEnvironment,
    suffix
}: CreateEnvironmentArgsType) => {
    const append = suffix || "";
    return {
        name: `${prefix}name${append}`,
        slug: `${prefix}slug${append}`,
        description: `${prefix}description${append}`,
        createdFrom: initialEnvironment.id
    };
};

const initialId = "5fc6590afb3cd80a5ae8a0ae";
const initialEnvironmentData = {
    id: initialId,
    name: "initial",
    slug: "initial",
    description: "initial"
};

const createMatchableUpdatedEnvironmentModel = (
    position: number,
    initialEnvironment: CmsEnvironmentType
): CmsEnvironmentType => {
    const initial = createEnvironmentModel({
        prefix: createEnvironmentPrefix(position),
        initialEnvironment,
        suffix: TestHelperEnum.SUFFIX as string
    });

    return {
        ...initial,
        id: /([a-z0-9A-Z]+)/,
        createdOn: /^20/,
        changedOn: /^20/,
        createdFrom: initialEnvironmentData,
        createdBy: {
            id: TestHelperEnum.USER_ID,
            name: TestHelperEnum.USER_NAME
        }
    } as any;
};

const createEnvironmentTestPartitionKey = () => {
    return createEnvironmentPk({
        security: {
            getTenant: () => ({
                id: "root",
                name: "Root",
                parent: null
            })
        },
        i18nContent: {
            locale: {
                code: "en-US"
            }
        }
    } as any);
};
const fetchInitialEnvironment = async (
    documentClient: DocumentClient
): Promise<CmsEnvironmentType> => {
    const response = await documentClient
        .get({
            TableName: "HeadlessCms",
            Key: {
                PK: createEnvironmentTestPartitionKey(),
                SK: initialId
            }
        })
        .promise();
    if (!response || !response.Item) {
        throw new Error(`Missing initial environment "${initialId}".`);
    }
    return (response.Item as unknown) as CmsEnvironmentType;
};

const expectedInitialEnvironment = {
    id: initialId,
    name: "initial",
    slug: "initial",
    description: "initial",
    createdOn: /^20/
};

describe("Environment crud test", () => {
    const {
        createEnvironmentMutation,
        getEnvironmentQuery,
        updateEnvironmentMutation,
        deleteEnvironmentMutation,
        listEnvironmentsQuery,
        documentClient
    } = useGqlHandler();

    beforeAll(async () => {
        await documentClient
            .put({
                TableName: "HeadlessCms",
                Item: {
                    PK: createEnvironmentTestPartitionKey(),
                    SK: initialId,
                    TYPE: "cms#env",
                    ...initialEnvironmentData,
                    createdOn: new Date().toISOString()
                }
            })
            .promise();
    });

    test("environment create, read, update, delete and list all at once", async () => {
        const initialEnvironment = await fetchInitialEnvironment(documentClient);

        const createdEnvironmentIdList = [];
        const prefixes = Array.from(Array(TestHelperEnum.MODELS_AMOUNT).keys()).map(prefix => {
            return createEnvironmentPrefix(prefix);
        });
        for (const prefix of prefixes) {
            const modelData = createEnvironmentModel({ prefix, initialEnvironment });

            const [createEnvironmentResponse] = await createEnvironmentMutation({
                data: modelData
            });
            expect(createEnvironmentResponse).toMatchObject({
                data: {
                    cms: {
                        createEnvironment: {
                            data: {
                                ...modelData,
                                createdFrom: {
                                    ...initialEnvironmentData
                                },
                                createdBy: {
                                    id: TestHelperEnum.USER_ID
                                },
                                createdOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });

            const createdEnvironmentId =
                createEnvironmentResponse.data.cms.createEnvironment.data.id;

            createdEnvironmentIdList.push(createdEnvironmentId);

            const [getEnvironmentResponse] = await getEnvironmentQuery({
                id: createdEnvironmentId
            });

            expect(getEnvironmentResponse).toMatchObject({
                data: {
                    cms: {
                        getEnvironment: {
                            data: {
                                ...modelData,
                                createdFrom: {
                                    ...initialEnvironmentData
                                },
                                createdBy: {
                                    id: TestHelperEnum.USER_ID
                                },
                                createdOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });

            const updatedModelData = createEnvironmentModel({
                prefix,
                initialEnvironment,
                suffix: TestHelperEnum.SUFFIX as string
            });

            const [updateEnvironmentResponse] = await updateEnvironmentMutation({
                id: createdEnvironmentId,
                data: updatedModelData
            });
            expect(updateEnvironmentResponse).toMatchObject({
                data: {
                    cms: {
                        updateEnvironment: {
                            data: {
                                ...updatedModelData,
                                createdFrom: {
                                    ...initialEnvironmentData
                                },
                                createdBy: {
                                    id: TestHelperEnum.USER_ID
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

        const [listEnvironmentsResponse] = await listEnvironmentsQuery();
        // +1 because of initial model
        expect(listEnvironmentsResponse.data.cms.listEnvironments.data).toHaveLength(
            TestHelperEnum.MODELS_AMOUNT + 1
        );
        expect(listEnvironmentsResponse).toMatchObject({
            data: {
                cms: {
                    listEnvironments: {
                        data: [
                            expectedInitialEnvironment,
                            createMatchableUpdatedEnvironmentModel(0, initialEnvironment),
                            createMatchableUpdatedEnvironmentModel(1, initialEnvironment),
                            createMatchableUpdatedEnvironmentModel(2, initialEnvironment)
                        ],
                        error: null
                    }
                }
            }
        });

        for (const id of createdEnvironmentIdList) {
            const [deleteEnvironmentResponse] = await deleteEnvironmentMutation({
                id
            });
            expect(deleteEnvironmentResponse).toMatchObject({
                data: {
                    cms: {
                        deleteEnvironment: {
                            data: true,
                            error: null
                        }
                    }
                }
            });
        }

        const [afterDeleteListResponse] = await listEnvironmentsQuery();
        expect(afterDeleteListResponse.data.cms.listEnvironments.data).toHaveLength(1);
        expect(afterDeleteListResponse).toMatchObject({
            data: {
                cms: {
                    listEnvironments: {
                        data: [expectedInitialEnvironment],
                        error: null
                    }
                }
            }
        });
    });
});
