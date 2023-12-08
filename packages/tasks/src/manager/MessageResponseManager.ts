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
    public constructor() {
        super();
    }

    public async done(params: IResponseManagerDoneParams): Promise<IResponseManagerDone> {
        return new TaskRunDoneResponse({
            ...params
        });
    }

    public async continue<T = unknown>(
        params: IResponseManagerContinueParams<T>
    ): Promise<IResponseManagerContinue<T>> {
        return new TaskRunContinueResponse<T>({
            id: params.task.id,
            input: params.input
        });
    }

    public async error(params: IResponseManagerErrorParams): Promise<IResponseManagerError> {
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
