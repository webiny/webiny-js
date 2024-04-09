import { PluginsContainer } from "@webiny/plugins";
import { PartialDeep } from "type-fest";
import { createMockIdentity } from "~tests/mocks/identity";
import {
    Context,
    ITaskLogUpdateInput,
    ITaskUpdateData,
    IUpdateTaskResponse
} from "@webiny/tasks/types";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";

export const createContextMock = (
    params?: PartialDeep<Context & ElasticsearchContext>
): Context & ElasticsearchContext => {
    return {
        tenancy: {
            listTenants: async () => {
                return [
                    {
                        id: "root",
                        name: "Root",
                        parent: null
                    }
                ];
            }
        },
        i18n: {
            getLocales: async () => {
                return [
                    {
                        code: "en-US",
                        default: true
                    }
                ];
            }
        },
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
            updateLog: async (id: string, data: ITaskLogUpdateInput) => {
                return {
                    ...data,
                    id,
                    createdOn: new Date().toISOString(),
                    createdBy: createMockIdentity()
                };
            },
            ...params?.tasks
        }
    } as unknown as Context & ElasticsearchContext;
};
