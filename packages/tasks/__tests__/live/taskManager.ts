import { TaskManager } from "~/runner/TaskManager";
import { createLiveRunner, CreateLiveRunnerParams } from "./runner";
import { Response, TaskResponse } from "~/response";
import { ITaskEvent } from "~/handler/types";
import { createLiveStore, CreateLiveStoreParams } from "./store";

export interface CreateLiveTaskManagerParams extends CreateLiveRunnerParams, CreateLiveStoreParams {
    event: ITaskEvent;
}

export const createLiveTaskManager = async (params: CreateLiveTaskManagerParams) => {
    const response = new Response(params.event);
    const taskResponse = new TaskResponse(response);
    const { runner, context } = await createLiveRunner(params);
    const { store } = await createLiveStore({
        context,
        ...params
    });

    const taskManager = new TaskManager(runner, context, response, taskResponse, store);

    return {
        runner,
        store,
        context,
        taskManager,
        response,
        taskResponse
    };
};
