import { ITaskRunResponse } from "~/types";

export interface ITaskError {
    message: string;
    code?: string;
    data?: Record<string, any> | null;
    stack?: any;
}

export interface ITaskManager {
    run: () => Promise<ITaskRunResponse>;
}
