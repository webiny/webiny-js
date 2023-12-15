import { PluginsContainer } from "@webiny/plugins";
import { Context, ITaskUpdateData, IUpdateTaskResponse } from "~/types";
import { MOCK_TASK_DEFINITION_ID } from "~tests/mocks/definition";
import { PartialDeep } from "type-fest";
import { createMockIdentity } from "~tests/mocks/identity";

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
                    startedOn: new Date(),
                    finishedOn: undefined,
                    createdOn: new Date(),
                    savedOn: new Date(),
                    definitionId: MOCK_TASK_DEFINITION_ID,
                    createdBy: createMockIdentity()
                };
            },
            ...params?.tasks
        }
    } as unknown as Context;
};
