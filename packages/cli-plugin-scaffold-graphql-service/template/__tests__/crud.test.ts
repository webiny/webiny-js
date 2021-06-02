import useGqlHandler from "./useGqlHandler";
import {
    GET_TARGET,
    CREATE_TARGET,
    DELETE_TARGET,
    LIST_TARGETS,
    UPDATE_TARGET
} from "./graphql/targets";

const targetsData = {
    target1: {
        title: "Target 1",
        description: "This is my 1st target.",
        isNice: false
    },
    target2: {
        title: "Target 2",
        description: "This is my 2nd target with isNice put to default (false)."
    },
    target3: {
        title: "Target 3",
        isNice: true
    }
};
/**
 * This is a simple test that asserts basic CRUD operations work as expected.
 * Feel free to update this test according to changes you made in the actual code.
 *
 * @see https://docs.webiny.com/docs/api-development/introduction
 */
describe("CRUD Test", () => {
    const {
        until,
        invoke,
    } = useGqlHandler();

    const createTarget = async (data: Record<string, any>) => {
        return await invoke({
            body: {
                query: CREATE_TARGET,
                variables: {
                    data
                }
            }
        });
    };

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Let's create a couple of targets.
        const [target1] = await createTarget(targetsData.target1);
        const [target2] = await createTarget(targetsData.target2);
        const [target3] = await createTarget(targetsData.target3);

        // TODO: remove until
        await until(
            () =>
                invoke({
                    body: {
                        query: LIST_TARGETS
                    }
                }).then(([data]) => data),
            ({ data }) => data.targets.listTargets.data.length === 3,
            { name: "list after created targets" }
        );

        // 2. Now that we have targets created, let's see if they come up in a basic listTargets query.
        const [targetsListResponse] = await invoke({
            body: {
                query: LIST_TARGETS
            }
        });

        expect(targetsListResponse).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target3.data.targets.createTarget.data.id,
                                ...targetsData.target3,
                                description: null
                            },
                            {
                                id: target2.data.targets.createTarget.data.id,
                                ...targetsData.target2,
                                isNice: false
                            },
                            {
                                id: target1.data.targets.createTarget.data.id,
                                ...targetsData.target1
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // 3. delete target2
        const [deleteResponse] = await invoke({
            body: {
                query: DELETE_TARGET,
                variables: {
                    id: target2.data.targets.createTarget.data.id
                }
            }
        });

        expect(deleteResponse).toEqual({
            data: {
                targets: {
                    deleteTarget: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // TODO: remove until
        await until(
            () =>
                invoke({
                    body: {
                        query: LIST_TARGETS
                    }
                }).then(([data]) => data),
            ({ data }) => data.targets.listTargets.data.length === 2,
            { name: "list after deleted target" }
        );

        const [targetListAfterDeleteResponse] = await invoke({
            body: {
                query: LIST_TARGETS
            }
        });

        expect(targetListAfterDeleteResponse).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target3.data.targets.createTarget.data.id,
                                ...targetsData.target3,
                                description: null
                            },
                            {
                                id: target1.data.targets.createTarget.data.id,
                                ...targetsData.target1
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // 4. update target 1
        const [updateResponse] = await invoke({
            body: {
                query: UPDATE_TARGET,
                variables: {
                    id: target1.data.targets.createTarget.data.id,
                    data: {
                        title: "Target 1 - updated",
                        description: "This is my 1st target. - updated",
                        isNice: true
                    }
                }
            }
        });

        expect(updateResponse).toEqual({
            data: {
                targets: {
                    updateTarget: {
                        data: {
                            id: target1.data.targets.createTarget.data.id,
                            title: "Target 1 - updated",
                            description: "This is my 1st target. - updated",
                            isNice: true
                        },
                        error: null
                    }
                }
            }
        });

        // 5. get target1 after the update
        const [getResponse] = await invoke({
            body: {
                query: GET_TARGET,
                variables: {
                    id: target1.data.targets.createTarget.data.id
                }
            }
        });

        expect(getResponse).toEqual({
            data: {
                targets: {
                    getTarget: {
                        data: {
                            id: target1.data.targets.createTarget.data.id,
                            title: "Target 1 - updated",
                            description: "This is my 1st target. - updated",
                            isNice: true
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("should sort targets", async () => {
        // 1. Let's create a couple of targets.
        const [target1] = await createTarget(targetsData.target1);
        const [target2] = await createTarget(targetsData.target2);
        const [target3] = await createTarget(targetsData.target3);

        // TODO: remove until
        await until(
            () =>
                invoke({
                    body: {
                        query: LIST_TARGETS
                    }
                }).then(([data]) => data),
            ({ data }) => data.targets.listTargets.data.length === 3,
            { name: "list targets" }
        );

        const [targetsListResponse] = await invoke({
            body: {
                query: LIST_TARGETS,
                variables: {
                    sort: ["createdOn_ASC"]
                }
            }
        });

        expect(targetsListResponse).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target1.data.targets.createTarget.data.id,
                                ...targetsData.target1
                            },
                            {
                                id: target2.data.targets.createTarget.data.id,
                                ...targetsData.target2,
                                isNice: false
                            },
                            {
                                id: target3.data.targets.createTarget.data.id,
                                ...targetsData.target3,
                                description: null
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test("should sort targets by title ASC", async () => {
        // 1. Let's create a couple of targets.
        const [target1] = await createTarget(targetsData.target1);
        const [target2] = await createTarget(targetsData.target2);
        const [target3] = await createTarget(targetsData.target3);

        // TODO: remove until
        await until(
            () =>
                invoke({
                    body: {
                        query: LIST_TARGETS
                    }
                }).then(([data]) => data),
            ({ data }) => data.targets.listTargets.data.length === 3,
            { name: "list targets" }
        );

        const [targetsListResponse] = await invoke({
            body: {
                query: LIST_TARGETS,
                variables: {
                    sort: ["title_ASC"]
                }
            }
        });

        expect(targetsListResponse).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target1.data.targets.createTarget.data.id,
                                ...targetsData.target1
                            },
                            {
                                id: target2.data.targets.createTarget.data.id,
                                ...targetsData.target2,
                                isNice: false
                            },
                            {
                                id: target3.data.targets.createTarget.data.id,
                                ...targetsData.target3,
                                description: null
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test("should sort targets by title desc", async () => {
        // 1. Let's create a couple of targets.
        const [target1] = await createTarget(targetsData.target1);
        const [target2] = await createTarget(targetsData.target2);
        const [target3] = await createTarget(targetsData.target3);

        // TODO: remove until
        await until(
            () =>
                invoke({
                    body: {
                        query: LIST_TARGETS
                    }
                }).then(([data]) => data),
            ({ data }) => data.targets.listTargets.data.length === 3,
            { name: "list targets" }
        );

        const [targetsListResponse] = await invoke({
            body: {
                query: LIST_TARGETS,
                variables: {
                    sort: ["title_DESC"]
                }
            }
        });

        expect(targetsListResponse).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target3.data.targets.createTarget.data.id,
                                ...targetsData.target3,
                                description: null
                            },
                            {
                                id: target2.data.targets.createTarget.data.id,
                                ...targetsData.target2,
                                isNice: false
                            },
                            {
                                id: target1.data.targets.createTarget.data.id,
                                ...targetsData.target1
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });
});
