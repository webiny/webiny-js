import { useGqlHandler } from "./useGqlHandler";
import { CmsEnvironmentType } from "@webiny/api-headless-cms/types";
import {
    createEnvironmentTestPartitionKey,
    deleteInitialEnvironment,
    fetchInitialEnvironment,
    getInitialEnvironment,
    getInitialEnvironmentId
} from "./helpers";
import toSlug from "@webiny/api-headless-cms/utils/toSlug";

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
        slug: toSlug(`${prefix}slug${append}`),
        description: `${prefix}description${append}`,
        createdFrom: initialEnvironment.id
    };
};

const createMatchableUpdatedEnvironmentModel = (
    position: number,
    initialEnvironment: CmsEnvironmentType
) => {
    const initialModel = createEnvironmentModel({
        prefix: createEnvironmentPrefix(position),
        initialEnvironment,
        suffix: TestHelperEnum.SUFFIX as string
    });

    return {
        ...initialModel,
        id: /([a-z0-9A-Z]+)/,
        createdOn: /^20/,
        changedOn: /^20/,
        createdFrom: getInitialEnvironment(),
        createdBy: {
            id: TestHelperEnum.USER_ID,
            name: TestHelperEnum.USER_NAME
        }
    };
};

const expectedInitialEnvironment = {
    ...getInitialEnvironment(),
    createdOn: /^20/
};

describe("Environment crud test", () => {
    const {
        createEnvironmentMutation,
        getEnvironmentQuery,
        updateEnvironmentMutation,
        deleteEnvironmentMutation,
        listEnvironmentsQuery,
        createEnvironmentAliasMutation,
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
                                    ...getInitialEnvironment()
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
                                    ...getInitialEnvironment()
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
                                    ...getInitialEnvironment()
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

    test("error on get non-existing environment", async () => {
        const [response] = await getEnvironmentQuery({
            id: "nonExistingId"
        });
        expect(response).toEqual({
            data: {
                cms: {
                    getEnvironment: {
                        data: null,
                        error: {
                            message: `CMS Environment "nonExistingId" not found.`,
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });
    });

    test("error on update of non-existing environment", async () => {
        const [response] = await updateEnvironmentMutation({
            id: "nonExistingId",
            data: {}
        });
        expect(response).toEqual({
            data: {
                cms: {
                    updateEnvironment: {
                        data: null,
                        error: {
                            message: `CMS Environment "nonExistingId" not found.`,
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });
    });

    test("error on delete of non-existing environment", async () => {
        const [response] = await deleteEnvironmentMutation({
            id: "nonExistingId",
            data: {}
        });
        expect(response).toEqual({
            data: {
                cms: {
                    deleteEnvironment: {
                        data: null,
                        error: {
                            message: `CMS Environment "nonExistingId" not found.`,
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });
    });

    test("error on creating a new environment when no environments in the database", async () => {
        await deleteInitialEnvironment(documentClient);
        const [response] = await createEnvironmentMutation({
            data: {
                name: "environment name",
                slug: "environment-name",
                description: "environment-description",
                createdFrom: getInitialEnvironmentId()
            }
        });
        expect(response).toEqual({
            data: {
                cms: {
                    createEnvironment: {
                        data: null,
                        error: {
                            message: `There are no environments in the database.`,
                            code: "CREATE_ENVIRONMENT_FAILED",
                            data: null
                        }
                    }
                }
            }
        });
    });

    test("error when faulty data is sent when creating new environment", async () => {
        const [nameResponse] = await createEnvironmentMutation({
            data: {
                slug: "environment-slug",
                createdFrom: getInitialEnvironmentId()
            }
        });

        expect(nameResponse).toEqual({
            data: {
                cms: {
                    createEnvironment: {
                        data: null,
                        error: {
                            message: `Validation failed.`,
                            code: "CREATE_ENVIRONMENT_FAILED",
                            data: null
                        }
                    }
                }
            }
        });

        const [createdFromResponse] = await createEnvironmentMutation({
            data: {
                name: "environment name",
                slug: "environment-slug"
            }
        });

        expect(createdFromResponse).toEqual({
            data: {
                cms: {
                    createEnvironment: {
                        data: null,
                        error: {
                            message: `Validation failed.`,
                            code: "CREATE_ENVIRONMENT_FAILED",
                            data: null
                        }
                    }
                }
            }
        });
    });

    test("error when no slug or name sent when creating new environment", async () => {
        const [response] = await createEnvironmentMutation({
            data: {
                createdFrom: getInitialEnvironmentId()
            }
        });
        expect(response).toEqual({
            data: {
                cms: {
                    createEnvironment: {
                        data: null,
                        error: {
                            message: `slugify: string argument expected`,
                            code: "CREATE_ENVIRONMENT_FAILED",
                            data: null
                        }
                    }
                }
            }
        });
    });

    test("error when non-existing createdFrom id sent when creating new environment", async () => {
        const [response] = await createEnvironmentMutation({
            data: {
                name: "environment name",
                slug: "environment-name",
                description: "environment-description",
                createdFrom: "nonExistingEnvironmentId"
            }
        });
        expect(response).toEqual({
            data: {
                cms: {
                    createEnvironment: {
                        data: null,
                        error: {
                            message: `Base environment ("createdFrom" field) not set or environment "nonExistingEnvironmentId" does not exist.`,
                            code: "CREATE_ENVIRONMENT_FAILED",
                            data: null
                        }
                    }
                }
            }
        });
    });

    test("error when trying to create a new environment with same slug as existing one in the database", async () => {
        await createEnvironmentMutation({
            data: {
                name: "environment name",
                description: "environment description",
                createdFrom: getInitialEnvironmentId()
            }
        });

        const [response] = await createEnvironmentMutation({
            data: {
                name: "environment name",
                description: "environment description",
                createdFrom: getInitialEnvironmentId()
            }
        });

        expect(response).toEqual({
            data: {
                cms: {
                    createEnvironment: {
                        data: null,
                        error: {
                            message: `Environment with slug "environment-name" already exists.`,
                            code: "CREATE_ENVIRONMENT_FAILED",
                            data: null
                        }
                    }
                }
            }
        });
    });

    test("error when deleting environment that has alias attached", async () => {
        await createEnvironmentAliasMutation({
            data: {
                name: "environment alias",
                environment: getInitialEnvironmentId()
            }
        });

        const [response] = await deleteEnvironmentMutation({
            id: getInitialEnvironmentId()
        });

        expect(response).toMatchObject({
            data: {
                cms: {
                    deleteEnvironment: {
                        data: null,
                        error: {
                            code: "DELETE_ENVIRONMENT_FAILED",
                            message: `Cannot delete the environment because it's currently linked to the "environment alias" environment aliases.`
                        }
                    }
                }
            }
        });
    });
});
