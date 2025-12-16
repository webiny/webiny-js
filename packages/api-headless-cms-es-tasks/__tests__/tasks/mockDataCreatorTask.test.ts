import { describe, expect, it, vi } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import type { IMockDataCreatorInput, IMockDataCreatorOutput } from "~/tasks/MockDataCreator/types";
import type { ICreateModelAndGroupResultSuccess } from "~/tasks/MockDataManager/createModelAndGroup";
import { createModelAndGroup } from "~/tasks/MockDataManager/createModelAndGroup";
import { CARS_MODEL_ID } from "~/tasks/MockDataManager/constants";
import { disableIndexing, enableIndexing } from "~/utils";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { MOCK_DATA_CREATOR_TASK_ID } from "~/tasks/MockDataCreatorTask.js";
import type { Context } from "~/types.js";
import { MOCK_DATA_MANAGER_TASK_ID } from "~/tasks/MockDataManagerTask.js";

vi.setConfig({
    testTimeout: 120_000
});

function getDataCreatorTaskDefinition(
    context: Context
): TaskDefinition.Interface<IMockDataCreatorInput, IMockDataCreatorOutput> {
    const definitions = context.container.resolveAll(TaskDefinition);
    const definition = definitions.find(def => def.id === MOCK_DATA_CREATOR_TASK_ID);

    if (definition) {
        return definition as TaskDefinition.Interface<
            IMockDataCreatorInput,
            IMockDataCreatorOutput
        >;
    }

    throw Error(`Task definition ${MOCK_DATA_MANAGER_TASK_ID} not found!`);
}

describe("mock data creator task", () => {
    it("should create a mock data creator task", async () => {
        const { handler } = useHandler();

        const context = await handler();

        const definition = getDataCreatorTaskDefinition(context);

        const modelAndGroupResult = (await createModelAndGroup({
            context,
            modelId: CARS_MODEL_ID
        })) as ICreateModelAndGroupResultSuccess;
        expect(modelAndGroupResult).not.toBeInstanceOf(String);

        await disableIndexing({
            client: context.elasticsearch,
            model: modelAndGroupResult.model
        });

        const task = await context.tasks.createTask<IMockDataCreatorInput>({
            definitionId: definition.id,
            name: "Testing of a Mock Data Creator Task",
            input: {
                createdAmount: 0,
                totalAmount: 100
            }
        });

        const runner = createRunner<IMockDataCreatorInput, IMockDataCreatorOutput>({
            context,
            task: definition
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root"
        });

        await enableIndexing({
            client: context.elasticsearch,
            model: modelAndGroupResult.model
        });

        expect(result).toMatchObject({
            status: TaskResultStatus.DONE
        });
    });
});
