import { useGqlHandler } from "./useGqlHandler";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CmsEnvironmentType } from "@webiny/api-headless-cms/types";

enum TestHelperEnum {
    MODELS_AMOUNT = 3, // number of test models to be created
    PREFIX = "environment",
    SUFFIX = "UPDATED",
    USER_ID = "1234567890"
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

const PARTITION_KEY = "en-US#CE";
const fetchInitialEnvironment = async (
    documentClient: DocumentClient
): Promise<CmsEnvironmentType> => {
    const response = await documentClient
        .get({
            TableName: "HeadlessCms",
            Key: {
                PK: PARTITION_KEY,
                SK: initialId
            }
        })
        .promise();
    if (!response || !response.Item) {
        throw new Error(`Missing initial environment "${initialId}".`);
    }
    return (response.Item as unknown) as CmsEnvironmentType;
};

const initialEnvironmentData = {
    id: initialId,
    name: "initial",
    slug: "initial",
    description: "initial"
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
                    PK: PARTITION_KEY,
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

        console.log(initialEnvironment);

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
                                createdOn: null
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

        const [listEnvironmentResponse] = await listEnvironmentsQuery();
        expect(listEnvironmentResponse).toMatchObject({
            data: {
                cms: {
                    listEnvironment: {
                        data: [
                            createEnvironmentModel({
                                prefix: createEnvironmentPrefix(0),
                                initialEnvironment,
                                suffix: TestHelperEnum.SUFFIX as string
                            }),
                            createEnvironmentModel({
                                prefix: createEnvironmentPrefix(1),
                                initialEnvironment,
                                suffix: TestHelperEnum.SUFFIX as string
                            }),
                            createEnvironmentModel({
                                prefix: createEnvironmentPrefix(2),
                                initialEnvironment,
                                suffix: TestHelperEnum.SUFFIX as string
                            })
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
                            data: {
                                id
                            },
                            error: null
                        }
                    }
                }
            });
        }

        const [afterDeleteListResponse] = await listEnvironmentsQuery();
        expect(afterDeleteListResponse).toMatchObject({
            data: {
                cms: {
                    listEnvironment: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });
});
