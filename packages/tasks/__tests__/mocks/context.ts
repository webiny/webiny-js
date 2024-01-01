import { PluginsContainer } from "@webiny/plugins";
import { Context, ITaskData, ITaskUpdateData, IUpdateTaskResponse } from "~/types";
import { PartialDeep } from "type-fest";
import { createMockTask } from "./task";

export const createMockContext = (params?: PartialDeep<Context>): Context => {
    const getTask = async (id: string): Promise<ITaskData> => {
        return {
            ...createMockTask(),
            id
        };
    };
    return {
        ...params,
        plugins: params?.plugins || new PluginsContainer(),
        tasks: {
            getTask,
            updateTask: async (id: string, data: ITaskUpdateData): Promise<IUpdateTaskResponse> => {
                const task = await getTask(id);
                return {
                    ...task,
                    ...data
                } as unknown as IUpdateTaskResponse;
            },
            ...params?.tasks
        }
    } as unknown as Context;
};
