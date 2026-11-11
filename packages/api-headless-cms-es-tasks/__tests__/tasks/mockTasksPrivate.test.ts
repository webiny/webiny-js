import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { MOCK_DATA_CREATOR_TASK_ID } from "~/tasks/MockDataCreatorTask.js";
import { MOCK_DATA_MANAGER_TASK_ID } from "~/tasks/MockDataManagerTask.js";

describe("mock data tasks", () => {
    it("should be private so they cannot be triggered through the API", async () => {
        const { handler } = useHandler();
        const context = await handler();

        const definitions = context.container.resolveAll(TaskDefinition);
        for (const id of [MOCK_DATA_MANAGER_TASK_ID, MOCK_DATA_CREATOR_TASK_ID]) {
            const definition = definitions.find(def => def.id === id);
            expect(definition).toBeDefined();
            expect(definition!.isPrivate).toBe(true);
        }
    });
});
