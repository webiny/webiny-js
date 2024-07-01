import { createRunner } from "@webiny/project-utils/testing/tasks";
import { useHandler } from "~tests/helpers/useHandler";
import { createExportContentEntriesTask } from "~/tasks";

jest.mock("~/tasks/domain/createExportContentEntries", () => {
    return {
        createExportContentEntries: () => {
            return {
                run: async () => {
                    return {
                        executed: true
                    };
                }
            };
        }
    };
});

describe("export content entries task", () => {
    it("should run the task", async () => {
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
            output: {},
            status: "done",
            tenant: "root",
            webinyTaskDefinitionId: "exportContentEntries",
            webinyTaskId: task.id
        });
    });
});
