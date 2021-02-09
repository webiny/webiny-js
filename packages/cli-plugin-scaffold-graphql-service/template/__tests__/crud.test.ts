import useGqlHandler from "./useGqlHandler";
import { CREATE_TARGET, LIST_TARGETS } from "./graphql/targets";

/**
 * This is a simple test that asserts basic CRUD operations work as expected.
 * Feel free to update this test according to changes you made in the actual code.
 *
 * @see https://docs.webiny.com/docs/api-development/introduction
 */
describe("CRUD Test", () => {
    const { invoke } = useGqlHandler();

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
                    data: { title: "Target 2", description: "This is my 2nd target." }
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
                                description: "This is my 2nd target.",
                                isNice: true
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

    it("should throw a validation error if title is invalid", async () => {
        // The title field is missing, the error should be thrown from the GraphQL and the resolver won't be executedd.
        let [body] = await invoke({
            body: {
                query: CREATE_TARGET,
                variables: {
                    data: { description: "This is my 1st target.", isNice: false }
                }
            }
        });

        const [error] = body.errors;
        expect(error.message).toBe(
            'Variable "$data" got invalid value { description: "This is my 1st target.", isNice: false }; Field title of required type String! was not provided.'
        );

        // Even though the title is provided, it is still too short (because of the validation
        // set on the "Target" Commodo model).
        [body] = await invoke({
            body: {
                query: CREATE_TARGET,
                variables: {
                    data: { title: "Aa", description: "This is my 1st target.", isNice: false }
                }
            }
        });

        expect(body).toEqual({
            data: {
                targets: {
                    createTarget: {
                        data: null,
                        error: {
                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                            message: "Validation failed.",
                            data: {
                                invalidFields: {
                                    title: "Value requires at least 3 characters."
                                }
                            }
                        }
                    }
                }
            }
        });
    });
});
