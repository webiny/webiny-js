import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createMockTaskDefinitions } from "~tests/mocks/definition";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

const useHandler = (permissions?: SecurityPermission[]) => {
    return useGraphQLHandler({ plugins: createMockTaskDefinitions(), permissions });
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
});
