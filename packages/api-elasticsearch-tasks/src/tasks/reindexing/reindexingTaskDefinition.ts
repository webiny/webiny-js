import { createTaskDefinition } from "@webiny/tasks";
import { Context, IElasticsearchIndexingTaskValues } from "~/types";
import { Manager, ManagerParams } from "../Manager";
import { ReindexingTaskRunner } from "./ReindexingTaskRunner";

export type CreateElasticsearchIndexTaskConfig = Pick<
    ManagerParams,
    "documentClient" | "elasticsearchClient"
>;

export const createElasticsearchReindexingTask = (params?: CreateElasticsearchIndexTaskConfig) => {
    return createTaskDefinition<Context, IElasticsearchIndexingTaskValues>({
        id: "elasticsearchReindexing",
        title: "Elasticsearch reindexing",
        run: async ({ context, isCloseToTimeout, response, values, isStopped, store }) => {
            const manager = new Manager({
                ...params,
                response,
                context,
                isStopped,
                isCloseToTimeout,
                store
            });
            const keys = values.keys || undefined;
            const reindexing = new ReindexingTaskRunner(manager, keys);
            return reindexing.exec(200);
        }
    });
};
