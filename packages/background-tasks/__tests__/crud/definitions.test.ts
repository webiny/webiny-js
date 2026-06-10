import { describe, it, expect } from "vitest";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition.js";

describe("tasks - definitions crud", () => {
    const handler = useRawHandler({
        plugins: [
            createTaskDefinition({
                id: "testDefinitionNumber1",
                title: "Test definition #1",
                run: ({ controller }) => {
                    return controller.response.done("successfully ran the task #1");
                }
            }),
            createTaskDefinition({
                id: "testDefinitionNumber2",
                title: "Test definition #2",
                run: ({ controller }) => {
                    return controller.response.done("successfully ran the task #2");
                }
            }),
            createTaskDefinition({
                id: "testDefinitionNumber3",
                title: "Test definition #3",
                run: ({ controller }) => {
                    return controller.response.done("successfully ran the task #3");
                }
            })
        ]
    });

    it("should get task definition", async () => {
        const context = await handler.handle();

        const definition = context.tasks.getDefinition("testDefinitionNumber1");
        expect(definition).toMatchObject({
            id: "testDefinitionNumber1",
            title: "Test definition #1"
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

        expect(definitions).toHaveLength(4);
        expect(definitions).toMatchObject([
            {
                id: "testingRun",
                title: "Test Step Function Permissions"
            },
            {
                id: "testDefinitionNumber1",
                title: "Test definition #1"
            },
            {
                id: "testDefinitionNumber2",
                title: "Test definition #2"
            },
            {
                id: "testDefinitionNumber3",
                title: "Test definition #3"
            }
        ]);
    });
});
