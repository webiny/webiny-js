import { useHandler } from "~tests/context/useHandler";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { Context } from "~/types";
import { IMockDataCreatorInput, IMockDataCreatorOutput } from "~/tasks/MockDataCreator/types";
import {
    createMockDataCreatorTask,
    MOCK_DATA_CREATOR_TASK_ID
} from "~/tasks/createMockDataCreatorTask";
import { TaskResponseStatus } from "@webiny/tasks";
import {
    createModelAndGroup,
    ICreateModelAndGroupResultSuccess
} from "~/tasks/MockDataManager/createModelAndGroup";
import { CARS_MODEL_ID } from "~/tasks/MockDataManager/constants";
import { disableIndexing, enableIndexing } from "~/utils";

jest.setTimeout(120000);

describe("mock data creator task", () => {
    it("should create a mock data creator task", async () => {
        const { handler } = useHandler();

        const context = await handler();

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
            definitionId: MOCK_DATA_CREATOR_TASK_ID,
            name: "Testing of a Mock Data Creator Task",
            input: {
                createdAmount: 0,
                totalAmount: 100
            }
        });

        const runner = createRunner<Context, IMockDataCreatorInput, IMockDataCreatorOutput>({
            context,
            task: createMockDataCreatorTask()
        });

        const result = await runner({
            webinyTaskId: task.id,
            tenant: "root",
            locale: "en-US"
        });

        await enableIndexing({
            client: context.elasticsearch,
            model: modelAndGroupResult.model
        });

        expect(result).toMatchObject({
            status: TaskResponseStatus.DONE
        });
    });
});
