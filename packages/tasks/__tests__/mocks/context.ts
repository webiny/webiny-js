import { PluginsContainer } from "@webiny/plugins";
import {
    Context,
    ITask,
    ITaskLog,
    ITaskLogUpdateInput,
    ITaskUpdateData,
    IUpdateTaskResponse
} from "~/types";
import { PartialDeep } from "type-fest";
import { createMockTask } from "./task";
import { createMockTaskLog } from "~tests/mocks/taskLog";

export const createMockContext = (params?: PartialDeep<Context>): Context => {
    const getTask = async (id: string): Promise<ITask> => {
        return {
            ...createMockTask(),
            id
        };
    };
    const getLog = async (id: string): Promise<ITaskLog> => {
        return {
            ...createMockTaskLog(await getTask("someId")),
            id
        };
    };
    return {
        ...params,
        plugins: params?.plugins || new PluginsContainer(),
        security: {
            withoutAuthorization<T = any>(cb: () => Promise<T>): Promise<T> {
                return cb();
            },
            ...params?.security
        },
        tasks: {
            getTask,
            updateTask: async (id: string, data: ITaskUpdateData): Promise<IUpdateTaskResponse> => {
                const task = await getTask(id);
                return {
                    ...task,
                    ...data
                } as unknown as IUpdateTaskResponse;
            },
            updateLog: async (id: string, data: ITaskLogUpdateInput): Promise<ITaskLog> => {
                return {
                    ...(await getLog(id)),
                    ...data
                };
            },
            ...params?.tasks
        }
    } as unknown as Context;
};
