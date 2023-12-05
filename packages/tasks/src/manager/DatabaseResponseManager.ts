import {
    IResponseManager,
    IResponseManagerContinue,
    IResponseManagerContinueParams,
    IResponseManagerDone,
    IResponseManagerDoneParams,
    IResponseManagerError,
    IResponseManagerErrorParams,
    ITaskData
} from "~/types";
import { ResponseManager } from "~/manager/ResponseManager";

export class DatabaseResponseManager extends ResponseManager {
    private readonly response: IResponseManager;
    private readonly task: ITaskData<any>;

    public constructor(response: IResponseManager, task: ITaskData<any>) {
        super();
        this.response = response;
        this.task = task;
    }

    public done(params: IResponseManagerDoneParams): IResponseManagerDone {
        return this.response.done(params);
    }

    public continue<T = unknown>(
        params: IResponseManagerContinueParams<T>
    ): IResponseManagerContinue<T> {
        return this.response.continue<T>(params);
    }

    public error(params: IResponseManagerErrorParams): IResponseManagerError {
        return this.response.error(params);
    }
}
