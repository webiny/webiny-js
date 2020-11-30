import { useGqlHandler } from "./useGqlHandler";

const TEST_MODELS_AMOUNT = 3; // number of test models to be created
const ENUM_PREFIX = "environment-";
const ENUM_SUFFIX = "UPDATED";
const ENUM_USER_DISPLAY_NAME = "userName123";
const ENUM_USER_ID = "1234567890";

const createEnvironmentPrefix = position => {
    return `${ENUM_PREFIX}-${position}`;
};
const createEnvironmentModel = (prefix, suffix) => {
    const append = suffix ? `_${suffix}` : "";
    return {
        name: `${prefix}_name${append}`,
        slug: `${prefix}_slug${append}`,
        description: `${prefix}_description${append}`,
        createdFrom: `${prefix}_createdFrom${append}`
    };
};
describe("Environment crud test", () => {
    const {
        createEnvironmentMutation,
        getEnvironmentQuery,
        updateEnvironmentMutation,
        deleteEnvironmentMutation,
        listEnvironmentQuery
    } = useGqlHandler();

    test("environment create, read, update, delete and list all at once", async () => {
        const createdEnvironmentIdList = [];
        const prefixes = Array.from(Array(TEST_MODELS_AMOUNT).keys()).map(prefix => {
            return createEnvironmentPrefix(prefix);
        });
        for (const prefix of prefixes) {
            const modelData = createEnvironmentModel(prefix);

            const [createEnvironmentResponse] = await createEnvironmentMutation({
                data: modelData
            });
            expect(createEnvironmentResponse).toMatchObject({
                data: {
                    cms: {
                        createEnvironment: {
                            data: {
                                ...modelData,
                                createdBy: {
                                    displayName: ENUM_USER_DISPLAY_NAME,
                                    id: ENUM_USER_ID
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
                                ...modelData
                            },
                            error: null
                        }
                    }
                }
            });

            const updatedModelData = createEnvironmentModel(prefix, ENUM_SUFFIX);

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
                                    displayName: ENUM_USER_DISPLAY_NAME,
                                    id: ENUM_USER_ID
                                },
                                createdOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });
        }

        const [listEnvironmentResponse] = await listEnvironmentQuery();
        expect(listEnvironmentResponse).toMatchObject({
            data: {
                cms: {
                    listEnvironment: {
                        data: [
                            createEnvironmentModel(createEnvironmentPrefix(0), ENUM_SUFFIX),
                            createEnvironmentModel(createEnvironmentPrefix(1), ENUM_SUFFIX),
                            createEnvironmentModel(createEnvironmentPrefix(2), ENUM_SUFFIX)
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

        const [afterDeleteListResponse] = await listEnvironmentQuery();
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
