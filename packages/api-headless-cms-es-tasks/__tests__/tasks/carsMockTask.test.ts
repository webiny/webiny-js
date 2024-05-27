import { CARS_MOCK_TASK_ID, createCarsMockTask } from "~/tasks/createCarsMockTask";
import { useHandler } from "~tests/context/useHandler";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { Context, ICarsMockInput, ICarsMockOutput } from "~/types";
import { TaskResponseStatus } from "@webiny/tasks";

describe("cars mock task", () => {
    it("should create a cars mock task", async () => {
        const { handler } = useHandler();

        const context = await handler();

        const task = await context.tasks.createTask<ICarsMockInput>({
            definitionId: CARS_MOCK_TASK_ID,
            name: "Testing of a Cars Mock Task",
            input: {
                amount: 1
            }
        });

        const runner = createRunner<Context, ICarsMockInput, ICarsMockOutput>({
            context,
            task: createCarsMockTask()
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root",
            locale: "en-US"
        });

        expect(result).toMatchObject({
            status: TaskResponseStatus.DONE
        });
    });
});
