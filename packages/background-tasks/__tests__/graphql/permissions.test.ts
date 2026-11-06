import { describe, expect, it } from "vitest";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createMockTaskDefinitions } from "~tests/mocks/definition";

interface GraphQLErrors {
    errors?: GraphQLError[];
}

interface GraphQLError {
    message: string;
}

const useHandler = (permissions: SecurityPermission[]) => {
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
        const { errors } = triggerResult as unknown as GraphQLErrors;
        expect(errors?.[0]?.message).toBe("Not authorized!");
    });

    it("should refuse deleting tasks with read and write access only", async () => {
        const handler = useHandler([{ name: "backgroundTasks.task", rwd: "rw" }]);

        const deleteResult = await handler.deleteTask({ id: "doesNotMatter" });
        const { errors } = deleteResult as unknown as GraphQLErrors;
        expect(errors?.[0]?.message).toBe("Not authorized!");
    });

    it("should refuse reading tasks without the background tasks permission", async () => {
        const handler = useHandler([{ name: "cms.endpoint.manage" }]);

        const listResult = await handler.listTasks();
        expect(listResult.data.backgroundTasks.listTasks.error).toMatchObject({
            code: "NOT_AUTHORIZED"
        });
    });

    it("should refuse the legacy `tasks` permission", async () => {
        const handler = useHandler([{ name: "tasks", rwd: "rwd" }]);

        const listResult = await handler.listTasks();
        expect(listResult.data.backgroundTasks.listTasks.error).toMatchObject({
            code: "NOT_AUTHORIZED"
        });
    });
});
