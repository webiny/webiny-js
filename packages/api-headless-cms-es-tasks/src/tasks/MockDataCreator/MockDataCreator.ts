import type { IMockDataCreatorInput, IMockDataCreatorOutput } from "./types.js";
import { mockData } from "./mockData.js";
import { createWaitUntilHealthy } from "@webiny/api-opensearch/utils/waitUntilHealthy/index.js";
import { OpenSearchCatClusterHealthStatus } from "@webiny/api-opensearch/operations/types.js";
import { mdbid } from "@webiny/utils";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { Context } from "~/types.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";

export class MockDataCreator<I extends IMockDataCreatorInput, O extends IMockDataCreatorOutput> {
    constructor(
        private readonly context: Context,
        private readonly openSearchClient: OpenSearchClient.Interface
    ) {}

    public async execute(
        params: TaskDefinition.RunParams<I, O>
    ): Promise<TaskDefinition.Result<I, O>> {
        const { input, controller } = params;

        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        } else if (controller.runtime.isCloseToTimeout()) {
            return controller.response.continue({
                ...input
            });
        }

        const getModel = this.context.container.resolve(GetModelUseCase);
        const createEntry = this.context.container.resolve(CreateEntryUseCase);

        const modelResult = await getModel.execute("cars");
        if (modelResult.isFail()) {
            return controller.response.error(modelResult.error);
        }

        const model = modelResult.value;

        const healthCheck = createWaitUntilHealthy(this.openSearchClient.use(), {
            waitingTimeStep: 20,
            maxWaitingTime: 150,
            maxProcessorPercent: 80,
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Yellow,
            maxRamPercent: 101
        });

        let createdAmount = input.createdAmount;

        for (; createdAmount < input.totalAmount; createdAmount++) {
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            } else if (controller.runtime.isCloseToTimeout()) {
                return controller.response.continue({
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
                    return controller.response.continue(
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
            const taskId = controller.state.getTask().id;

            const createResult = await createEntry.execute(model, {
                id: `${taskId}${mdbid()}`,
                location: mockData.wbyAco_location,
                values: mockData
            });

            if (createResult.isFail()) {
                return controller.response.error(createResult.error);
            }
        }

        return params.controller.response.done(`Created ${input.totalAmount} records.`);
    }
}
