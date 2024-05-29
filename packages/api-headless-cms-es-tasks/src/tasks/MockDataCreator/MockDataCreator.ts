import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { IMockDataCreatorInput, IMockDataCreatorOutput } from "./types";
import { CmsModelManager } from "@webiny/api-headless-cms/types";
import { mockData } from "./mockData";
import { createWaitUntilHealthy } from "@webiny/api-elasticsearch/utils/waitUntilHealthy";
import { Context } from "~/types";
import { ElasticsearchCatHealthStatus } from "@webiny/api-elasticsearch/operations/types";
import { mdbid } from "@webiny/utils";

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

        let manager: CmsModelManager;
        try {
            manager = await context.cms.getEntryManager("cars");
        } catch (ex) {
            return response.error(ex);
        }

        const max = input.totalAmount - input.createdAmount;

        const healthCheck = createWaitUntilHealthy(context.elasticsearch, {
            waitingTimeStep: 20,
            maxWaitingTime: 150,
            maxProcessorPercent: 80,
            minStatus: ElasticsearchCatHealthStatus.Yellow,
            maxRamPercent: 101
        });

        let createdAmount = input.createdAmount;

        for (; createdAmount < max; createdAmount++) {
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
                        async onUnhealthy({ waitingTimeStep, startedAt, mustEndAt, runs }) {
                            console.warn(`Cluster is unhealthy on run #${runs}.`, {
                                startedAt,
                                mustEndAt,
                                waitingTimeStep
                            });
                        }
                    });
                } catch (ex) {
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
            try {
                await manager.create({
                    id: `${taskId}${mdbid()}`,
                    ...mockData
                });
            } catch (ex) {
                return response.error(ex);
            }
        }

        return params.response.done(`Created ${input.totalAmount} of records.`);
    }
}
