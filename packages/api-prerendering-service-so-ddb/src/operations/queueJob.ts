import WebinyError from "@webiny/error";
import {
    PrerenderingServiceQueueJobStorageOperations,
    PrerenderingServiceStorageOperationsCreateQueueJobParams,
    PrerenderingServiceStorageOperationsDeleteQueueJobsParams,
    QueueJob
} from "@webiny/api-prerendering-service/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { queryAllClean, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { put } from "@webiny/db-dynamodb";

export interface CreateQueueJobStorageOperationsParams {
    entity: Entity<any>;
}

export const createQueueJobStorageOperations = (
    params: CreateQueueJobStorageOperationsParams
): PrerenderingServiceQueueJobStorageOperations => {
    const { entity } = params;

    const createQueueJobPartitionKey = (): string => {
        return "PS#Q#JOB";
    };
    const createQueueJobSortKey = (id: string): string => {
        return id;
    };

    const createQueueJobType = () => {
        return "ps.queue.job";
    };

    const createQueueJob = async (
        params: PrerenderingServiceStorageOperationsCreateQueueJobParams
    ): Promise<QueueJob> => {
        const { queueJob } = params;
        const keys = {
            PK: createQueueJobPartitionKey(),
            SK: createQueueJobSortKey(queueJob.id)
        };

        try {
            await put({
                entity,
                item: {
                    ...queueJob,
                    ...keys,
                    TYPE: createQueueJobType()
                }
            });
            return queueJob;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create render record.",
                ex.code || "CREATE_RENDER_ERROR",
                {
                    keys,
                    queueJob
                }
            );
        }
    };

    const listQueueJobs = async () => {
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createQueueJobPartitionKey(),
            options: {
                gte: " "
            }
        };

        try {
            return await queryAllClean<QueueJob>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list queue jobs records.",
                ex.code || "LIST_QUEUE_JOBS_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }
    };

    const deleteQueueJobs = async (
        params: PrerenderingServiceStorageOperationsDeleteQueueJobsParams
    ) => {
        const { queueJobs } = params;

        const items = queueJobs.map(job => {
            return entity.deleteBatch({
                PK: createQueueJobPartitionKey(),
                SK: createQueueJobSortKey(job.id)
            });
        });

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            return queueJobs;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete queue jobs records.",
                ex.code || "DELETE_QUEUE_JOBS_ERROR",
                {
                    queueJobs
                }
            );
        }
    };

    return {
        createQueueJob,
        deleteQueueJobs,
        listQueueJobs
    };
};
