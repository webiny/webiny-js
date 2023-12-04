import {
    IResponseManager,
    IResponseManagerContinue,
    IResponseManagerContinueParams,
    IResponseManagerDone,
    IResponseManagerDoneParams,
    IResponseManagerError,
    IResponseManagerErrorParams,
    ITaskRunResponse,
    TaskResponseStatus
} from "~/types";

export abstract class ResponseManager implements IResponseManager {
    public abstract done(params: IResponseManagerDoneParams): IResponseManagerDone;

    public abstract continue<T = unknown>(
        params: IResponseManagerContinueParams<T>
    ): IResponseManagerContinue<T>;

    public abstract error(params: IResponseManagerErrorParams): IResponseManagerError;

    public from(
        response: IResponseManagerDone | IResponseManagerContinue | IResponseManagerError
    ): ITaskRunResponse {
        switch (response.status) {
            case TaskResponseStatus.DONE:
                return this.done({
                    ...response,
                    task: {
                        id: response.id
                    }
                });
            case TaskResponseStatus.ERROR:
                return this.error({
                    ...response,
                    task: {
                        id: response.id
                    }
                });
            case TaskResponseStatus.CONTINUE:
                return this.continue({
                    ...response,
                    task: {
                        id: response.id
                    }
                });
            default:
                return this.error({
                    task: {
                        id: "unknown"
                    },
                    error: {
                        code: "unknown",
                        /**
                         * We need to try to output the unknown status.
                         * It should not happen, but due to possible changes in the status list, it is possible.
                         *
                         * Also, the @ts-expect-error with throw a build time error if the status list is changed.
                         */
                        // @ts-expect-error
                        message: `Unknown response status: ${response.status}.`
                    },
                    input: {}
                });
        }
    }
}
