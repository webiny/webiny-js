import { describe, it, expect } from "vitest";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition.js";
import { TaskDefinitionNotFoundError } from "~/api/domain/errors.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/index.js";
import { ListTaskDefinitionsUseCase } from "~/api/features/ListTaskDefinitions/abstractions.js";

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

        const definition = context.container
            .resolve(GetRunnableTaskDefinitionUseCase)
            .execute("testDefinitionNumber1").value;
        expect(definition).toMatchObject({
            id: "testDefinitionNumber1",
            title: "Test definition #1"
        });
    });

    it("should fail when definition does not exist", async () => {
        const context = await handler.handle();

        const result = context.container
            .resolve(GetRunnableTaskDefinitionUseCase)
            .execute("non-existing-definition");
        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(TaskDefinitionNotFoundError);
    });

    it("should list all definitions", async () => {
        const context = await handler.handle();

        const definitions = context.container.resolve(ListTaskDefinitionsUseCase).execute();

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
