import type { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import type { IMockDataCreatorInput, IMockDataCreatorOutput } from "./types.js";
import { mockData } from "./mockData.js";
import { createWaitUntilHealthy } from "@webiny/api-elasticsearch/utils/waitUntilHealthy/index.js";
import type { Context } from "~/types.js";
import { ElasticsearchCatClusterHealthStatus } from "@webiny/api-elasticsearch/operations/types.js";
import { mdbid } from "@webiny/utils";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";

export class MockDataCreator<
    C extends Context,
    I extends IMockDataCreatorInput,
    O extends IMockDataCreatorOutput
> {
    public async execute(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, isAborted, input, response, isCloseToTimeout } = params;

        if (isAborted()) {
            return response.aborted();
        } else if (isCloseToTimeout()) {
            return response.continue({
                ...input
            });
        }

        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);

        const modelResult = await getModel.execute("cars");
        if (modelResult.isFail()) {
            return response.error(modelResult.error);
        }

        const model = modelResult.value;

        const healthCheck = createWaitUntilHealthy(context.elasticsearch, {
            waitingTimeStep: 20,
            maxWaitingTime: 150,
            maxProcessorPercent: 80,
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Yellow,
            maxRamPercent: 101
        });

        let createdAmount = input.createdAmount;

        for (; createdAmount < input.totalAmount; createdAmount++) {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({
                    ...input,
                    createdAmount
                });
            }
            if (createdAmount % 50 === 0) {
                try {
                    await healthCheck.wait({
                        async onUnhealthy({
                            waitingTimeStep,
                            startedAt,
                            mustEndAt,
                            runs,
                            waitingReason
                        }) {
                            console.warn(`Cluster is unhealthy on run #${runs}.`, {
                                startedAt,
                                mustEndAt,
                                waitingTimeStep,
                                waitingReason
                            });
                        },
                        async onTimeout({
                            waitingTimeStep,
                            startedAt,
                            mustEndAt,
                            runs,
                            waitingReason
                        }) {
                            console.warn(`Cluster health check timed out on run #${runs}.`, {
                                startedAt,
                                mustEndAt,
                                waitingTimeStep,
                                waitingReason
                            });
                        }
                    });
                } catch {
                    return response.continue(
                        {
                            ...input,
                            createdAmount
                        },
                        {
                            seconds: 30
                        }
                    );
                }
            }
            const taskId = params.store.getTask().id;

            const createResult = await createEntry.execute(model, {
                id: `${taskId}${mdbid()}`,
                ...mockData
            });

            if (createResult.isFail()) {
                return response.error(createResult.error);
            }
        }

        return params.response.done(`Created ${input.totalAmount} records.`);
    }
}
