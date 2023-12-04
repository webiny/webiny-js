import {
    IResponseManagerContinue,
    IResponseManagerContinueParams,
    IResponseManagerDone,
    IResponseManagerDoneParams,
    IResponseManagerError,
    IResponseManagerErrorParams
} from "~/types";
import {
    TaskRunContinueResponse,
    TaskRunDoneResponse,
    TaskRunErrorResponse
} from "~/manager/response";
import { ResponseManager } from "~/manager/ResponseManager";

export class MessageResponseManager extends ResponseManager {
    public done(params: IResponseManagerDoneParams): IResponseManagerDone {
        return new TaskRunDoneResponse(params);
    }

    public continue<T = unknown>(
        params: IResponseManagerContinueParams<T>
    ): IResponseManagerContinue<T> {
        return new TaskRunContinueResponse<T>({
            id: params.task.id,
            input: params.input
        });
    }

    public error(params: IResponseManagerErrorParams): IResponseManagerError {
        return new TaskRunErrorResponse({
            id: params.task.id,
            error: {
                message: params.error.message,
                code: params.error.code,
                data: params.error.data
            },
            input: params.input
        });
    }
}
