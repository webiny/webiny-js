import { PluginsContainer } from "@webiny/plugins";
import { PartialDeep } from "type-fest";
import { createMockIdentity } from "~tests/mocks/identity";
import { Context, ITaskUpdateData, IUpdateTaskResponse } from "@webiny/tasks/types";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";

export const createContextMock = (
    params?: PartialDeep<Context & ElasticsearchContext>
): Context & ElasticsearchContext => {
    return {
        ...params,
        plugins: params?.plugins || new PluginsContainer(),
        tasks: {
            updateTask: async (
                id: string,
                data: Required<ITaskUpdateData>
            ): Promise<IUpdateTaskResponse> => {
                return {
                    ...data,
                    id,
                    startedOn: new Date().toISOString(),
                    finishedOn: undefined,
                    createdOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    definitionId: "myCustomTaskDefinition",
                    createdBy: createMockIdentity(),
                    eventResponse: {} as any
                };
            },
            ...params?.tasks
        }
    } as unknown as Context & ElasticsearchContext;
};
