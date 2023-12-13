import { useHandler } from "~tests/helpers/useHandler";
import { createRegisterTaskPlugin } from "~/task";

describe("definitions crud", () => {
    const handler = useHandler({
        plugins: [
            createRegisterTaskPlugin({
                id: "testDefinition-1",
                name: "Test definition #1",
                async run({ response }) {
                    return response.done("successfully ran the task #1");
                }
            }),
            createRegisterTaskPlugin({
                id: "testDefinition-2",
                name: "Test definition #2",
                async run({ response }) {
                    return response.done("successfully ran the task #2");
                }
            }),
            createRegisterTaskPlugin({
                id: "testDefinition-3",
                name: "Test definition #3",
                async run({ response }) {
                    return response.done("successfully ran the task #3");
                }
            })
        ]
    });

    it("should get task definition", async () => {
        const context = await handler.handle();

        const definition = context.tasks.getDefinition("testDefinition-1");
        expect(definition).toMatchObject({
            id: "testDefinition-1",
            name: "Test definition #1"
        });
    });

    it("should return null when definition does not exist", async () => {
        const context = await handler.handle();

        const definition = context.tasks.getDefinition("non-existing-definition");
        expect(definition).toBeNull();
    });

    it("should list all definitions", async () => {
        const context = await handler.handle();

        const definitions = context.tasks.listDefinitions();

        expect(definitions).toHaveLength(3);
        expect(definitions).toMatchObject([
            {
                id: "testDefinition-1",
                name: "Test definition #1"
            },
            {
                id: "testDefinition-2",
                name: "Test definition #2"
            },
            {
                id: "testDefinition-3",
                name: "Test definition #3"
            }
        ]);
    });
});
