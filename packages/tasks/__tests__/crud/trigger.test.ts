import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createMockTaskDefinitions } from "~tests/mocks/definition";
import { createMockIdentity } from "~tests/mocks/identity";
import { TaskDataStatus } from "~/types";

describe("trigger crud", () => {
    const handler = useRawHandler({
        plugins: [...createMockTaskDefinitions()]
    });

    it("should trigger a task", async () => {
        const context = await handler.handle();

        const result = await context.tasks.trigger({
            definition: "myCustomTaskNumber1",
            name: "A test of triggering task",
            input: {
                myAnotherCustomValue: "myAnotherCustomValue",
                myCustomValue: "myCustomValue"
            }
        });

        expect(result).toEqual({
            id: expect.toBeString(),
            name: "A test of triggering task",
            definitionId: "myCustomTaskNumber1",
            executionName: "",
            input: {
                myAnotherCustomValue: "myAnotherCustomValue",
                myCustomValue: "myCustomValue"
            },
            iterations: 0,
            taskStatus: TaskDataStatus.PENDING,
            createdBy: createMockIdentity(),
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/),
            startedOn: undefined,
            finishedOn: undefined,
            eventResponse: expect.any(Object)
        });
    });
});
