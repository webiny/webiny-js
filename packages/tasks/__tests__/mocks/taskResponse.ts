import { TaskResponse } from "~/response";
import { IResponse, ITaskResponse } from "~/response/abstractions";

export const createMockTaskResponse = (response: IResponse): ITaskResponse => {
    return new TaskResponse(response);
};
