import { useAdminGqlHandler } from "../utils/useAdminGqlHandler";
import {
    identity,
    createInitialEnvironment,
    fetchInitialEnvironment,
    getInitialEnvironment,
    getInitialEnvironmentId
} from "../utils/helpers";
import { CmsEnvironmentType } from "@webiny/api-headless-cms/types";
import { toSlug } from "@webiny/api-headless-cms/utils";

enum TestHelperEnum {
    MODELS_AMOUNT = 3,
    PREFIX = "alias",
    SUFFIX = "UPDATED"
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
        slug: toSlug(`${prefix}slug`),
        description: `${prefix}description${append}`,
        environment: environment.id
    };
};

describe("Environment alias crud test", () => {
    const {
        createEnvironmentAliasMutation,
        getEnvironmentAliasQuery,
        updateEnvironmentAliasMutation,
        deleteEnvironmentAliasMutation,
        listEnvironmentAliasesQuery,
        getEnvironmentQuery,
        documentClient
    } = useAdminGqlHandler();

    beforeEach(async () => {
        await createInitialEnvironment(documentClient);
    });

    test("environment alias create, read, update, delete and list all at once", async () => {
        const environment = await fetchInitialEnvironment(documentClient);

        const updatedEnvironmentAliases = [];
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
                                changedOn: /^20/,
                                createdBy: identity
                            },
                            error: null
                        }
                    }
                }
            });
            const {
                id: createdEnvironmentAliasId,
                createdOn
            } = createResponse.data.cms.createEnvironmentAlias.data;

            const [getResponse] = await getEnvironmentAliasQuery({
                id: createdEnvironmentAliasId
            });

            expect(getResponse).toEqual({
                data: {
                    cms: {
                        getEnvironmentAlias: {
                            data: {
                                id: createdEnvironmentAliasId,
                                ...modelData,
                                environment: getInitialEnvironment(),
                                createdBy: identity,
                                isProduction: false,
                                createdOn,
                                changedOn: createdOn
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
                                id: createdEnvironmentAliasId,
                                ...updatedModelData,
                                environment: getInitialEnvironment(),
                                createdBy: identity,
                                createdOn,
                                changedOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });
            updatedEnvironmentAliases.push(updateResponse.data.cms.updateEnvironmentAlias.data);
        }

        const [listResponse] = await listEnvironmentAliasesQuery();
        expect(listResponse.data.cms.listEnvironmentAliases.data).toHaveLength(
            TestHelperEnum.MODELS_AMOUNT
        );
        expect(listResponse).toEqual({
            data: {
                cms: {
                    listEnvironmentAliases: {
                        data: updatedEnvironmentAliases,
                        error: null
                    }
                }
            }
        });

        for (const { id } of updatedEnvironmentAliases) {
            const [deleteResponse] = await deleteEnvironmentAliasMutation({
                id
            });
            expect(deleteResponse).toEqual({
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

    test("error on get non-existing alias", async () => {
        const [response] = await getEnvironmentAliasQuery({
            id: "nonExistingId"
        });
        expect(response).toEqual({
            data: {
                cms: {
                    getEnvironmentAlias: {
                        data: null,
                        error: {
                            message: `CMS EnvironmentAlias "nonExistingId" not found.`,
                            code: "NOT_FOUND"
                        }
                    }
                }
            }
        });
    });

    test("error when no name and slug sent when creating new environment alias", async () => {
        const [response] = await createEnvironmentAliasMutation({
            data: {
                environment: getInitialEnvironmentId()
            }
        });
        expect(response).toEqual({
            data: {
                cms: {
                    createEnvironmentAlias: {
                        data: null,
                        error: {
                            code: "CREATE_ENVIRONMENT_ALIAS_FAILED",
                            message: "slugify: string argument expected"
                        }
                    }
                }
            }
        });
    });

    test("error when missing name when creating new environment alias", async () => {
        const [response] = await createEnvironmentAliasMutation({
            data: {
                slug: "alias-slug",
                environment: getInitialEnvironmentId()
            }
        });
        expect(response).toEqual({
            data: {
                cms: {
                    createEnvironmentAlias: {
                        data: null,
                        error: {
                            code: "CREATE_ENVIRONMENT_ALIAS_FAILED",
                            message: "Validation failed."
                        }
                    }
                }
            }
        });
    });

    test("error when missing environment when creating new environment alias", async () => {
        const [response] = await createEnvironmentAliasMutation({
            data: {
                name: "alias name",
                slug: "alias-slug"
            }
        });
        expect(response).toEqual({
            data: {
                cms: {
                    createEnvironmentAlias: {
                        data: null,
                        error: {
                            code: "CREATE_ENVIRONMENT_ALIAS_FAILED",
                            message: "Validation failed."
                        }
                    }
                }
            }
        });
    });

    test("error when environment sent does not exist in the database when creating new environment alias", async () => {
        const [response] = await createEnvironmentAliasMutation({
            data: {
                name: "alias name",
                slug: "alias-slug",
                environment: "nonExistingId"
            }
        });
        expect(response).toEqual({
            data: {
                cms: {
                    createEnvironmentAlias: {
                        data: null,
                        error: {
                            code: "CREATE_ENVIRONMENT_ALIAS_FAILED",
                            message: `Target Environment "nonExistingId" does not exist.`
                        }
                    }
                }
            }
        });
    });

    test("error when environment alias with same slug already exists", async () => {
        await createEnvironmentAliasMutation({
            data: {
                name: "alias name",
                slug: "alias-slug",
                environment: getInitialEnvironmentId()
            }
        });

        const [response] = await createEnvironmentAliasMutation({
            data: {
                name: "alias name",
                slug: "alias-slug",
                environment: getInitialEnvironmentId()
            }
        });
        expect(response).toEqual({
            data: {
                cms: {
                    createEnvironmentAlias: {
                        data: null,
                        error: {
                            code: "CREATE_ENVIRONMENT_ALIAS_FAILED",
                            message: `Environment alias with the slug "alias-slug" already exists.`
                        }
                    }
                }
            }
        });
    });

    test("error when updating non-existing environment alias", async () => {
        const [response] = await updateEnvironmentAliasMutation({
            id: "nonExistingId",
            data: {}
        });
        expect(response).toEqual({
            data: {
                cms: {
                    updateEnvironmentAlias: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            message: `CMS EnvironmentAlias "nonExistingId" not found.`
                        }
                    }
                }
            }
        });
    });

    test("error when updating environment alias with non-existing environment", async () => {
        const environment = await fetchInitialEnvironment(documentClient);
        const modelData = createEnvironmentAliasModel({ prefix: "prefix", environment });
        const [createResponse] = await createEnvironmentAliasMutation({
            data: modelData
        });
        const id = createResponse.data.cms.createEnvironmentAlias.data.id;

        const [response] = await updateEnvironmentAliasMutation({
            id: id,
            data: {
                environment: "nonExistingEnvironmentId"
            }
        });

        expect(response).toEqual({
            data: {
                cms: {
                    updateEnvironmentAlias: {
                        data: null,
                        error: {
                            code: "UPDATE_ENVIRONMENT_ALIAS_FAILED",
                            message: `Target Environment "nonExistingEnvironmentId" does not exist.`
                        }
                    }
                }
            }
        });
    });

    test("error when deleting non-existing environment alias", async () => {
        const [response] = await deleteEnvironmentAliasMutation({
            id: "nonExistingId"
        });

        expect(response).toEqual({
            data: {
                cms: {
                    deleteEnvironmentAlias: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            message: `CMS EnvironmentAlias "nonExistingId" not found.`
                        }
                    }
                }
            }
        });
    });

    test("error when deleting production environment alias", async () => {
        const [createResponse] = await createEnvironmentAliasMutation({
            data: {
                name: "production",
                slug: "production",
                environment: getInitialEnvironmentId()
            }
        });

        const id = createResponse.data.cms.createEnvironmentAlias.data.id;

        const [response] = await deleteEnvironmentAliasMutation({
            id: id
        });

        expect(response).toEqual({
            data: {
                cms: {
                    deleteEnvironmentAlias: {
                        data: null,
                        error: {
                            code: "DELETE_ENVIRONMENT_ALIAS_FAILED",
                            message: `Cannot delete "production" environment alias, it is marked as a production alias.`
                        }
                    }
                }
            }
        });
    });

    test("production alias makes environment a production one", async () => {
        const environment = await fetchInitialEnvironment(documentClient);

        const [response] = await createEnvironmentAliasMutation({
            data: {
                name: "Is production alias",
                slug: "production",
                description: "Must be a production alias",
                environment: environment.id
            }
        });

        expect(response).toMatchObject({
            data: {
                cms: {
                    createEnvironmentAlias: {
                        data: {
                            changedOn: /^20/,
                            createdBy: {
                                displayName: "User 123",
                                id: "123",
                                type: "admin"
                            },
                            createdOn: /^20/,
                            description: "Must be a production alias",
                            environment: {
                                createdBy: {
                                    displayName: "User 123",
                                    id: "123",
                                    type: "admin"
                                },
                                description: "Production environment description",
                                id: "5fc6590afb3cd80a5ae8a0ae",
                                name: "Production",
                                slug: "production"
                            },
                            id: /^([a-zA-Z0-9]+)$/,
                            isProduction: true,
                            name: "Is production alias",
                            slug: "production"
                        },
                        error: null
                    }
                }
            }
        });

        const [environmentResponse] = await getEnvironmentQuery({
            id: environment.id
        });

        expect(environmentResponse).toMatchObject({
            data: {
                cms: {
                    getEnvironment: {
                        data: {
                            changedOn: /^20/,
                            createdBy: {
                                displayName: "User 123",
                                id: "123",
                                type: "admin"
                            },
                            createdFrom: null,
                            createdOn: /^20/,
                            description: "Production environment description",
                            id: "5fc6590afb3cd80a5ae8a0ae",
                            isProduction: true,
                            name: "Production",
                            slug: "production"
                        },
                        error: null
                    }
                }
            }
        });
    });
});
