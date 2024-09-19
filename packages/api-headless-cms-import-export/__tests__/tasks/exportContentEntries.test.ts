import { createRunner } from "@webiny/project-utils/testing/tasks";
import { useHandler } from "~tests/helpers/useHandler";
import { createExportContentEntriesTask } from "~/tasks";
import type { ITaskRunParams } from "@webiny/tasks";

jest.mock("~/tasks/domain/createExportContentEntries", () => {
    return {
        createExportContentEntries: () => {
            return {
                run: async ({ input }: ITaskRunParams<any, any, any>) => {
                    if (input.kill) {
                        throw new Error("An error happened!");
                    }
                    return {
                        executed: true
                    };
                }
            };
        }
    };
});

describe("export content entries task", () => {
    it("should run the task and return a done response", async () => {
        const { createContext } = useHandler();
        const context = await createContext();

        const definition = createExportContentEntriesTask();

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
            locale: "en-US",
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

        const definition = createExportContentEntriesTask();

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
            locale: "en-US",
            status: "error",
            tenant: "root",
            webinyTaskDefinitionId: "exportContentEntries",
            webinyTaskId: task.id
        });
    });
});
