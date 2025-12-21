import { describe, expect, it } from "vitest";
import { MOCK_DATA_MANAGER_TASK_ID } from "~/tasks/MockDataManagerTask.js";
import { useHandler } from "~tests/context/useHandler";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import type { Context, IMockDataManagerInput, IMockDataManagerOutput } from "~/types";
import { CARS_MODEL_ID } from "~/tasks/MockDataManager/constants";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

function getDataManagerTaskDefinition(
    context: Context
): TaskDefinition.Interface<IMockDataManagerInput, IMockDataManagerOutput> {
    const definitions = context.container.resolveAll(TaskDefinition);
    const definition = definitions.find(def => def.id === MOCK_DATA_MANAGER_TASK_ID);

    if (definition) {
        return definition as TaskDefinition.Interface<
            IMockDataManagerInput,
            IMockDataManagerOutput
        >;
    }

    throw Error(`Task definition ${MOCK_DATA_MANAGER_TASK_ID} not found!`);
}

describe("mock data manager task", () => {
    it("should create a mock data manager task", async () => {
        const { handler } = useHandler();

        const context = await handler();
        const definition = getDataManagerTaskDefinition(context);

        const task = await context.tasks.createTask<IMockDataManagerInput>({
            definitionId: definition.id,
            name: "Testing of a Mock Data Manager Task",
            input: {
                modelId: CARS_MODEL_ID,
                amount: 1
            }
        });

        const runner = createRunner<IMockDataManagerInput, IMockDataManagerOutput>({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root"
        });

        expect(result).toMatchObject({
            status: TaskResultStatus.CONTINUE,
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
