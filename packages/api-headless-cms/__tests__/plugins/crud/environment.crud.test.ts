import { CmsEnvironmentType } from "@webiny/api-headless-cms/types";
import {
    createInitialEnvironment,
    deleteInitialEnvironment,
    fetchInitialEnvironment,
    getInitialEnvironment,
    getInitialEnvironmentId
} from "../../helpers";
import toSlug from "@webiny/api-headless-cms/utils/toSlug";
import { useAdminGqlHandler } from "../../useAdminGqlHandler";

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
        slug: toSlug(`${prefix}slug`),
        description: `${prefix}description${append}`,
        createdFrom: initialEnvironment.id
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
    } = useAdminGqlHandler();

    beforeEach(async () => {
        await createInitialEnvironment(documentClient);
    });

    test("environment create, read, update, delete and list all at once", async () => {
        const initialEnvironment = await fetchInitialEnvironment(documentClient);

        const updatedEnvironments = [];
        const prefixes = Array.from(Array(TestHelperEnum.MODELS_AMOUNT).keys()).map(prefix => {
            return createEnvironmentPrefix(prefix);
        });
        for (const prefix of prefixes) {
            const modelData = createEnvironmentModel({ prefix, initialEnvironment });

            const [createResponse] = await createEnvironmentMutation({
                data: modelData
            });
            expect(createResponse).toMatchObject({
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

            const {
                id: createdEnvironmentId,
                createdOn
            } = createResponse.data.cms.createEnvironment.data;

            const [getResponse] = await getEnvironmentQuery({
                id: createdEnvironmentId
            });

            expect(getResponse).toEqual({
                data: {
                    cms: {
                        getEnvironment: {
                            data: {
                                id: createdEnvironmentId,
                                ...modelData,
                                createdFrom: {
                                    ...getInitialEnvironment()
                                },
                                createdBy: {
                                    id: TestHelperEnum.USER_ID,
                                    name: TestHelperEnum.USER_NAME
                                },
                                createdOn,
                                changedOn: null
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

            const [updateResponse] = await updateEnvironmentMutation({
                id: createdEnvironmentId,
                data: updatedModelData
            });
            expect(updateResponse).toMatchObject({
                data: {
                    cms: {
                        updateEnvironment: {
                            data: {
                                id: createdEnvironmentId,
                                ...updatedModelData,
                                createdFrom: {
                                    ...getInitialEnvironment()
                                },
                                createdBy: {
                                    id: TestHelperEnum.USER_ID,
                                    name: TestHelperEnum.USER_NAME
                                },
                                createdOn,
                                changedOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });

            updatedEnvironments.push(updateResponse.data.cms.updateEnvironment.data);
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
                        data: [expectedInitialEnvironment, ...updatedEnvironments],
                        error: null
                    }
                }
            }
        });

        for (const { id } of updatedEnvironments) {
            const [deleteEnvironmentResponse] = await deleteEnvironmentMutation({
                id
            });
            expect(deleteEnvironmentResponse).toEqual({
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

        expect(response).toEqual({
            data: {
                cms: {
                    deleteEnvironment: {
                        data: null,
                        error: {
                            code: "DELETE_ENVIRONMENT_FAILED",
                            data: null,
                            message: `Cannot delete the environment because it's currently linked to the "environment alias" environment aliases.`
                        }
                    }
                }
            }
        });
    });
});
