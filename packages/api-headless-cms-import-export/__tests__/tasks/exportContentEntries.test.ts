import { describe, expect, it, vi } from "vitest";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { useHandler } from "~tests/helpers/useHandler";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { Context } from "~/types.js";
import { EXPORT_CONTENT_ENTRIES_TASK } from "~/tasks/constants.js";

vi.mock("~/features/ExportContentEntriesTask/ExportContentEntries.js", () => {
    return {
        ExportContentEntries: vi.fn().mockImplementation(function () {
            // @ts-expect-error
            this.run = async ({ input }: TaskDefinition.RunParams<any, any>) => {
                if (input.kill) {
                    throw new Error("An error happened!");
                }
                return {
                    executed: true
                };
            };
        })
    };
});

function getTaskDefinition(context: Context) {
    const tasks = context.container.resolveAll(TaskDefinition);
    return tasks.find(task => task.id === EXPORT_CONTENT_ENTRIES_TASK)!;
}

describe("export content entries task", () => {
    it("should run the task and return a done response", async () => {
        const { createContext } = useHandler();
        const context = await createContext();

        const definition = getTaskDefinition(context);

        const task = await context.tasks.createTask({
            name: "Create mock export content entries task",
            definitionId: definition.id,
            input: {}
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id
        });
        expect(result).toEqual({
            message: undefined,
            status: "done",
            tenant: "root",
            webinyTaskDefinitionId: "exportContentEntries",
            webinyTaskId: task.id
        });
    });

    it("should run the task and return an error", async () => {
        const { createContext } = useHandler();
        const context = await createContext();

        const definition = getTaskDefinition(context);

        const task = await context.tasks.createTask({
            name: "Create mock export content entries task",
            definitionId: definition.id,
            input: {
                kill: true
            }
        });

        const runner = createRunner({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id
        });
        expect(result).toEqual({
            error: {
                data: {
                    input: {
                        kill: true
                    }
                },
                message: "An error happened!"
            },
            status: "error",
            tenant: "root",
            webinyTaskDefinitionId: "exportContentEntries",
            webinyTaskId: task.id
        });
    });
});
