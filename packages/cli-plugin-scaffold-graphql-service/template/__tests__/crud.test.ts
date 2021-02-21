import useGqlHandler from "./useGqlHandler";
import { CREATE_TARGET, LIST_TARGETS } from "./graphql/targets";

/**
 * This is a simple test that asserts basic CRUD operations work as expected.
 * Feel free to update this test according to changes you made in the actual code.
 *
 * @see https://docs.webiny.com/docs/api-development/introduction
 */
describe("CRUD Test", () => {
    const { until, invoke, clearElasticsearchIndexes } = useGqlHandler();

    beforeEach(async () => {
        clearElasticsearchIndexes();
    });

    afterEach(async () => {
        clearElasticsearchIndexes();
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Let's create a couple of targets.
        const [target1] = await invoke({
            body: {
                query: CREATE_TARGET,
                variables: {
                    data: {
                        title: "Target 1",
                        description: "This is my 1st target.",
                        isNice: false
                    }
                }
            }
        });

        const [target2] = await invoke({
            body: {
                query: CREATE_TARGET,
                variables: {
                    data: {
                        title: "Book 2",
                        description: "This is my 2nd target with isNice put to default (false)."
                    }
                }
            }
        });

        const [target3] = await invoke({
            body: {
                query: CREATE_TARGET,
                variables: {
                    data: { title: "Target 3", isNice: true }
                }
            }
        });

        // if this `until` resolves successfully, we know targets are propagated into elasticsearch
        await until(
            () =>
                invoke({
                    body: {
                        query: LIST_TARGETS
                    }
                }).then(([data]) => data),
            ({ data }) => data.books.listBooks.data.length === 3,
            { name: "get created product" }
        );

        // 2. Now that we have targets created, let's see if they come up in a basic listTargets query.
        const [targetsList] = await invoke({
            body: {
                query: LIST_TARGETS
            }
        });

        expect(targetsList).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target3.data.targets.createTarget.data.id,
                                title: "Target 3",
                                description: null,
                                isNice: true
                            },
                            {
                                id: target2.data.targets.createTarget.data.id,
                                title: "Target 2",
                                description:
                                    "This is my 2nd target with isNice put to default (false).",
                                isNice: false
                            },
                            {
                                id: target1.data.targets.createTarget.data.id,
                                title: "Target 1",
                                description: "This is my 1st target.",
                                isNice: false
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });
});
