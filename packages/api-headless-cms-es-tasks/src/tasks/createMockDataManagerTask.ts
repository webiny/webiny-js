import { createTaskDefinition } from "@webiny/tasks";
import { Context } from "~/types";
import { IMockDataManagerInput, IMockDataManagerOutput } from "~/tasks/MockDataManager/types";
import { CARS_MODEL_ID } from "~/tasks/MockDataManager/constants";
import { enableIndexing } from "~/utils";

export const MOCK_DATA_MANAGER_TASK_ID = "mockDataManager";

export const createMockDataManagerTask = () => {
    return createTaskDefinition<Context, IMockDataManagerInput, IMockDataManagerOutput>({
        id: MOCK_DATA_MANAGER_TASK_ID,
        title: "Mock Data Manager",
        maxIterations: 500,
        async run(params) {
            const { MockDataManager } = await import(
                /* webpackChunkName: "MockDataManager" */ "./MockDataManager/MockDataManager"
            );

            const carsMock = new MockDataManager<
                Context,
                IMockDataManagerInput,
                IMockDataManagerOutput
            >();

            try {
                return await carsMock.execute({
                    ...params,
                    input: {
                        ...params.input,
                        modelId: CARS_MODEL_ID
                    }
                });
            } catch (ex) {
                return params.response.error(ex);
            }
        },
        async onError({ context }) {
            await enableIndexing({
                client: context.elasticsearch,
                model: {
                    modelId: CARS_MODEL_ID,
                    tenant: "root",
                    locale: "en-US"
                }
            });
        },
        async onAbort({ context }) {
            await enableIndexing({
                client: context.elasticsearch,
                model: {
                    modelId: CARS_MODEL_ID,
                    tenant: "root",
                    locale: "en-US"
                }
            });
        }
    });
};
