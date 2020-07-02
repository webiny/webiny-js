import useGqlHandler from "./useGqlHandler";
import { CREATE_ENTITY, LIST_ENTITIES } from "./graphql/entities";

/**
 * This is a simple test that asserts basic CRUD operations work as expected.
 */
describe("CRUD Test", () => {
    const { invoke } = useGqlHandler();

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Let's create a couple of entities.
        let [entity1] = await invoke({
            body: {
                query: CREATE_ENTITY,
                variables: {
                    data: { title: "Entity 1" }
                }
            }
        });

        let [entity2] = await invoke({
            body: {
                query: CREATE_ENTITY,
                variables: {
                    data: { title: "Entity 2" }
                }
            }
        });

        let [entity3] = await invoke({
            body: {
                query: CREATE_ENTITY,
                variables: {
                    data: { title: "Entity 3" }
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
                            { id: entity3.data.entities.createEntity.data.id, title: "Entity 3" },
                            { id: entity2.data.entities.createEntity.data.id, title: "Entity 2" },
                            { id: entity1.data.entities.createEntity.data.id, title: "Entity 1" }
                        ]
                    }
                }
            }
        });
    });
});
