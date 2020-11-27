import { useGqlHandler } from "./useGqlHandler";

type EnvironmentModelType = {
    name: string;
    slug: string;
    description: string;
    createdFrom: string;
};

enum TestHelperEnum {
    PREFIX = "environment-",
    SUFFIX = "UPDATED",
    USER_DISPLAY_NAME = "userName123",
    USER_ID = "1234567890"
}

const createEnvironmentPrefix = (position: number): string => {
    return `${TestHelperEnum.PREFIX}-${position}`;
};
const createEnvironmentModel = (prefix: string, suffix?: string): EnvironmentModelType => {
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
        createEnvironmentQuery,
        getEnvironmentQuery,
        updateEnvironmentQuery,
        deleteEnvironmentQuery,
        listEnvironmentQuery
    } = useGqlHandler();

    test("environment create, read, update, delete and list all at once", async () => {
        const createdEnvironmentIdList: string[] = [];
        for (let i = 0; i < 3; i++) {
            const prefix = createEnvironmentPrefix(i);
            const modelData = createEnvironmentModel(prefix);

            const [createEnvironmentResponse] = await createEnvironmentQuery({
                data: modelData
            });
            expect(createEnvironmentResponse).toMatchObject({
                data: {
                    cms: {
                        createEnvironment: {
                            data: {
                                ...modelData,
                                createdBy: {
                                    displayName: TestHelperEnum.USER_DISPLAY_NAME,
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
                                ...modelData
                            },
                            error: null
                        }
                    }
                }
            });

            const updatedModelData = createEnvironmentModel(prefix, TestHelperEnum.SUFFIX);

            const [updateEnvironmentResponse] = await updateEnvironmentQuery({
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
                                    displayName: TestHelperEnum.USER_DISPLAY_NAME,
                                    id: TestHelperEnum.USER_ID
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
                            createEnvironmentModel(
                                createEnvironmentPrefix(0),
                                TestHelperEnum.SUFFIX
                            ),
                            createEnvironmentModel(
                                createEnvironmentPrefix(1),
                                TestHelperEnum.SUFFIX
                            ),
                            createEnvironmentModel(
                                createEnvironmentPrefix(2),
                                TestHelperEnum.SUFFIX
                            )
                        ],
                        error: null
                    }
                }
            }
        });

        for (const id of createdEnvironmentIdList) {
            const [deleteEnvironmentResponse] = await deleteEnvironmentQuery({
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
