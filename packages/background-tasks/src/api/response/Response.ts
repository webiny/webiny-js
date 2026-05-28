import sizeOfObject from "object-sizeof";

import type { ITaskEvent } from "~/api/handler/types.js";
import type {
    IResponse,
    IResponseAbortedResult,
    IResponseContinueParams,
    IResponseContinueResult,
    IResponseDoneParams,
    IResponseDoneResult,
    IResponseErrorParams,
    IResponseErrorResult,
    IResponseFromParams,
    IResponseResult
} from "./abstractions/index.js";
import { ResponseContinueResult } from "~/api/response/ResponseContinueResult.js";
import { ResponseDoneResult } from "~/api/response/ResponseDoneResult.js";
import { ResponseErrorResult } from "~/api/response/ResponseErrorResult.js";
import { ResponseAbortedResult } from "./ResponseAbortedResult.js";
import { getErrorProperties } from "~/api/utils/getErrorProperties.js";
import {
    TaskDefinition,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

/**
 * Step Functions has a limit of 256KB for the output size.
 * We will set the max output to be 232KB to leave some room for the rest of the data.
 */
const MAX_SIZE_BYTES: number = 232 * 1024;

interface ICreateMaxSizeOutputParams {
    size: number;
}

const createMaxSizeOutput = <O extends TaskDefinition.TaskOutput>({
    size
}: ICreateMaxSizeOutputParams): O => {
    return {
        message: `Output size exceeds the maximum allowed size.`,
        size,
        max: MAX_SIZE_BYTES
    } as unknown as O;
};
/**
 * Figure out the size of the output object and remove the stack trace if the size exceeds the maximum allowed size.
 * If the size is still greater than the maximum allowed size, just return the message that the output size exceeds the maximum allowed size.
 */
const getOutput = <O extends TaskDefinition.TaskOutput>(output?: O): O | undefined => {
    if (!output || Object.keys(output).length === 0) {
        return undefined;
    }
    let size = sizeOfObject(output);
    if (size > MAX_SIZE_BYTES) {
        if (output.stack) {
            delete output.stack;
            size = sizeOfObject(output);
            if (size <= MAX_SIZE_BYTES) {
                return output;
            }
        }
        if (output.error?.stack) {
            delete output.error.stack;
            size = sizeOfObject(output);
            if (size <= MAX_SIZE_BYTES) {
                return output;
            }
        }
        return createMaxSizeOutput<O>({ size });
    }
    return output;
};

export class Response implements IResponse {
    private _event: ITaskEvent;

    public get event(): ITaskEvent {
        return this._event;
    }

    public constructor(event: ITaskEvent) {
        this._event = event;
    }

    public setEvent(event: ITaskEvent) {
        this._event = event;
    }

    public from(params: IResponseFromParams): IResponseResult {
        switch (params.status) {
            case TaskResultStatus.DONE:
                return this.done(params);
            case TaskResultStatus.CONTINUE:
                return this.continue(params);
            case TaskResultStatus.ERROR:
                return this.error(params);
        }
    }

    public continue(params: IResponseContinueParams): IResponseContinueResult {
        return new ResponseContinueResult({
            message: params.message,
            input: params.input,
            webinyTaskId: params?.webinyTaskId || this.event.webinyTaskId,
            webinyTaskDefinitionId: this.event.webinyTaskDefinitionId,
            tenant: params?.tenant || this.event.tenant,
            wait: params.wait
        });
    }

    public done<O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput>(
        params?: IResponseDoneParams<O>
    ): IResponseDoneResult<O> {
        return new ResponseDoneResult<O>({
            webinyTaskId: params?.webinyTaskId || this.event.webinyTaskId,
            webinyTaskDefinitionId: this.event.webinyTaskDefinitionId,
            tenant: params?.tenant || this.event.tenant,
            message: params?.message,
            output: getOutput<O>(params?.output)
        });
    }

    public aborted(): IResponseAbortedResult {
        return new ResponseAbortedResult({
            webinyTaskId: this.event.webinyTaskId,
            webinyTaskDefinitionId: this.event.webinyTaskDefinitionId,
            tenant: this.event.tenant
        });
    }

    public error(params: IResponseErrorParams): IResponseErrorResult {
        return new ResponseErrorResult({
            webinyTaskId: params.webinyTaskId || this.event.webinyTaskId,
            webinyTaskDefinitionId: this.event.webinyTaskDefinitionId,
            tenant: params.tenant || this.event.tenant,
            error: params.error instanceof Error ? getErrorProperties(params.error) : params.error
        });
    }
}
