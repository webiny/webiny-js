import { Response, TaskResponse } from "~/response";
import { IResponse } from "~/types";
import { ITaskEvent } from "~/handler/types";

export interface CreateLiveTaskResponseWithResponse {
    response: IResponse;
    event?: never;
}
export interface CreateLiveTaskResponseWithEvent {
    event: ITaskEvent;
    response?: never;
}

export type CreateLiveTaskResponse =
    | CreateLiveTaskResponseWithResponse
    | CreateLiveTaskResponseWithEvent;

export const createLiveTaskResponse = (params: CreateLiveTaskResponse) => {
    const response = params?.response || new Response(params.event);

    return new TaskResponse(response);
};
