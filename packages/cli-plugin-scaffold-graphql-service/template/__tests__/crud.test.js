import useGqlHandler from "./useGqlHandler";
import { CREATE_ENTITY, LIST_ENTITIES } from "./graphql/entities";

/**
 * This is a simple test that asserts basic CRUD operations work as expected.
 * Feel free to update this test according to changes you made in the actual code.
 *
 * @see https://docs.webiny.com/docs/api-development/introduction
 */
describe("CRUD Test", () => {
    const { invoke } = useGqlHandler();

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Let's create a couple of entities.
        let [entity1] = await invoke({
            body: {
                query: CREATE_ENTITY,
                variables: {
                    data: {
                        title: "Entity 1",
                        description: "This is my 1st entity.",
                        isNice: false
                    }
                }
            }
        });

        let [entity2] = await invoke({
            body: {
                query: CREATE_ENTITY,
                variables: {
                    data: { title: "Entity 2", description: "This is my 2nd entity." }
                }
            }
        });

        let [entity3] = await invoke({
            body: {
                query: CREATE_ENTITY,
                variables: {
                    data: { title: "Entity 3", isNice: true }
                }
            }
        });

        // 2. Now that we have entities created, let's see if they come up in a basic listEntities query.
        let [entitiesList] = await invoke({
            body: {
                query: LIST_ENTITIES
            }
        });

        expect(entitiesList).toEqual({
            data: {
                entities: {
                    listEntities: {
                        data: [
                            {
                                id: entity3.data.entities.createEntity.data.id,
                                title: "Entity 3",
                                description: null,
                                isNice: true
                            },
                            {
                                id: entity2.data.entities.createEntity.data.id,
                                title: "Entity 2",
                                description: "This is my 2nd entity.",
                                isNice: true
                            },
                            {
                                id: entity1.data.entities.createEntity.data.id,
                                title: "Entity 1",
                                description: "This is my 1st entity.",
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
                query: CREATE_ENTITY,
                variables: {
                    data: { description: "This is my 1st entity.", isNice: false }
                }
            }
        });

        let [error] = body.errors;
        expect(error.message).toBe(
            'Variable "$data" got invalid value { description: "This is my 1st entity.", isNice: false }; Field title of required type String! was not provided.'
        );

        // Even though the title is provided, it is still too short (because of the validation
        // set on the "Entity" Commodo model).
        [body] = await invoke({
            body: {
                query: CREATE_ENTITY,
                variables: {
                    data: { title: "Aa", description: "This is my 1st entity.", isNice: false }
                }
            }
        });

        expect(body).toEqual({
            data: {
                entities: {
                    createEntity: {
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
