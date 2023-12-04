import {
    ITaskRunResponseManager,
    ITaskRunResponseManagerContinueResponse,
    ITaskRunResponseManagerContinueParams,
    ITaskRunResponseManagerDoneResponse,
    ITaskRunResponseManagerDoneParams,
    ITaskRunResponseManagerErrorResponse,
    ITaskRunResponseManagerErrorParams,
    TaskResponseStatus
} from "~/types";

export class TaskResponseManager implements ITaskRunResponseManager {
    continue<T>(
        params: ITaskRunResponseManagerContinueParams<T>
    ): ITaskRunResponseManagerContinueResponse<T> {
        return {
            status: TaskResponseStatus.CONTINUE,
            input: params.input
        };
    }
    done(params?: ITaskRunResponseManagerDoneParams): ITaskRunResponseManagerDoneResponse {
        const result: ITaskRunResponseManagerDoneResponse = {
            status: TaskResponseStatus.DONE
        };
        if (params?.message) {
            result.message = params.message;
        }
        return result;
    }
    error(params: ITaskRunResponseManagerErrorParams): ITaskRunResponseManagerErrorResponse {
        return {
            status: TaskResponseStatus.ERROR,
            error: params.error
        };
    }
}
