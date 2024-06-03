import {
    MOCK_DATA_MANAGER_TASK_ID,
    createMockDataManagerTask
} from "~/tasks/createMockDataManagerTask";
import { useHandler } from "~tests/context/useHandler";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { Context, IMockDataManagerInput, IMockDataManagerOutput } from "~/types";
import { TaskResponseStatus } from "@webiny/tasks";
import { CARS_MODEL_ID } from "~/tasks/MockDataManager/constants";

describe("mock data manager task", () => {
    it("should create a mock data manager task", async () => {
        const { handler } = useHandler();

        const context = await handler();

        const task = await context.tasks.createTask<IMockDataManagerInput>({
            definitionId: MOCK_DATA_MANAGER_TASK_ID,
            name: "Testing of a Mock Data Manager Task",
            input: {
                modelId: CARS_MODEL_ID,
                amount: 1
            }
        });

        const runner = createRunner<Context, IMockDataManagerInput, IMockDataManagerOutput>({
            context,
            task: createMockDataManagerTask()
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root",
            locale: "en-US"
        });

        expect(result).toMatchObject({
            status: TaskResponseStatus.CONTINUE,
            wait: 15,
            input: {
                amount: 1,
                seconds: 15,
                amountOfTasks: 1,
                amountOfRecords: 1
            }
        });

        const childTasks = await context.tasks.listTasks({
            where: {
                parentId: task.id
            },
            limit: 10000
        });
        expect(childTasks).toMatchObject({
            items: [
                {
                    name: "Mock Data Creator Task #1 of 1"
                }
            ],
            meta: {
                totalCount: 1
            }
        });
    });
});
