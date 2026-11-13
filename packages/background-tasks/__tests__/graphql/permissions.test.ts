import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createMockTaskDefinitions } from "~tests/mocks/definition";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition";
import type { PermissionsArg } from "~tests/helpers/helpers";

const PRIVATE_TASK_ID = "myPrivateTask";

const createPlugins = () => {
    return [
        ...createMockTaskDefinitions(),
        createTaskDefinition({
            id: PRIVATE_TASK_ID,
            title: "A private task",
            isPrivate: true,
            run({ controller }) {
                return controller.response.done("done");
            }
        })
    ];
};

const useHandler = (permissions?: PermissionsArg[]) => {
    return useGraphQLHandler({ plugins: createPlugins(), permissions });
};

describe("graphql - background task permissions", () => {
    it("should allow reading and starting tasks with the background tasks permission", async () => {
        const handler = useHandler([{ name: "backgroundTasks.task", rwd: "rwd" }]);

        const listResult = await handler.listTasks();
        expect(listResult.data.backgroundTasks.listTasks.error).toBeNull();

        const triggerResult = await handler.triggerTask({ definition: "myCustomTaskNumber1" });
        expect(triggerResult.data.backgroundTasks.triggerTask.error).toBeNull();
        expect(triggerResult.data.backgroundTasks.triggerTask.data?.definitionId).toBe(
            "myCustomTaskNumber1"
        );
    });

    it("should allow reading but not starting tasks with read-only access", async () => {
        const handler = useHandler([{ name: "backgroundTasks.task", rwd: "r" }]);

        const listResult = await handler.listTasks();
        expect(listResult.data.backgroundTasks.listTasks.error).toBeNull();

        const triggerResult = await handler.triggerTask({ definition: "myCustomTaskNumber1" });
        // The mutation refuses before resolving, so the error is a GraphQL error.
        const { errors } = triggerResult as unknown as { errors?: { message: string }[] };
        expect(errors?.[0]?.message).toBe("Not authorized!");
    });

    it("should refuse reading tasks without the background tasks permission", async () => {
        const handler = useHandler([{ name: "cms.endpoint.manage" }]);

        const listResult = await handler.listTasks();
        expect(listResult.data.backgroundTasks.listTasks.error).toMatchObject({
            code: "NOT_AUTHORIZED"
        });
    });

    it("should not start a private task", async () => {
        const handler = useHandler();

        const result = await handler.triggerTask({ definition: PRIVATE_TASK_ID });
        expect(result.data.backgroundTasks.triggerTask).toMatchObject({
            data: null,
            error: {
                code: "TASK_DEFINITION_ERROR",
                message: "Task definition was not found!"
            }
        });
    });
});
