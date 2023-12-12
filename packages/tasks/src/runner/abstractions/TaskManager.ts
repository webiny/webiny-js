import { IResponseResult } from "~/response/abstractions";

export interface ITaskManager {
    run: () => Promise<IResponseResult>;
}
