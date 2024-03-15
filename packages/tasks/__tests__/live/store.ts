import { TaskManagerStore } from "~/runner/TaskManagerStore";
import { createLiveContext, CreateLiveContextParams } from "~tests/live/context";
import { ITask, ITaskLog } from "~/types";
import { Context } from "~tests/types";

export interface CreateLiveStoreParams<C extends Context = Context>
    extends CreateLiveContextParams {
    task: ITask<any, any>;
    taskLog: ITaskLog;
    context?: C;
}

export const createLiveStore = async <C extends Context = Context>(
    params: CreateLiveStoreParams<C>
) => {
    const context = params.context || (await createLiveContext(params));

    const store = new TaskManagerStore(context, params.task, params.taskLog);

    return {
        store,
        context
    };
};
