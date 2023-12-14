import { PluginsContainer } from "@webiny/plugins";
import { Context, ITaskUpdateData, IUpdateTaskResponse } from "~/types";
import { MOCK_TASK_DEFINITION_ID } from "~tests/mocks/definition";
import { PartialDeep } from "type-fest";

export const createMockContext = (params?: PartialDeep<Context>): Context => {
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
                    createdOn: new Date(),
                    savedOn: new Date(),
                    definitionId: MOCK_TASK_DEFINITION_ID
                };
            },
            ...params?.tasks
        }
    } as unknown as Context;
};
