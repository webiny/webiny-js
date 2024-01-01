import { TaskManagerStore, TaskManagerStoreContext } from "~/runner/TaskManagerStore";
import { ITaskData, ITaskDataValues } from "~/types";
import { createMockContext } from "~tests/mocks/context";
import { createMockTask } from "~tests/mocks/task";

interface Params {
    context?: TaskManagerStoreContext;
    task?: ITaskData<ITaskDataValues>;
}

export const createMockTaskManagerStore = (params?: Params) => {
    return new TaskManagerStore(
        params?.context || createMockContext(),
        params?.task || createMockTask()
    );
};
