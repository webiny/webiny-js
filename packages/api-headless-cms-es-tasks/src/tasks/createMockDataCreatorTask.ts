import { createTaskDefinition } from "@webiny/tasks";
import { Context } from "~/types";
import { IMockDataCreatorInput, IMockDataCreatorOutput } from "~/tasks/MockDataCreator/types";

export const MOCK_DATA_CREATOR_TASK_ID = "mockDataCreator";

export const createMockDataCreatorTask = () => {
    return createTaskDefinition<Context, IMockDataCreatorInput, IMockDataCreatorOutput>({
        id: MOCK_DATA_CREATOR_TASK_ID,
        title: "Mock Data Creator",
        maxIterations: 500,
        async run(params) {
            const { MockDataCreator } = await import(
                /* webpackChunkName: "MockDataCreator" */ "./MockDataCreator/MockDataCreator"
            );

            const carsMock = new MockDataCreator<
                Context,
                IMockDataCreatorInput,
                IMockDataCreatorOutput
            >();

            try {
                return await carsMock.execute(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};
