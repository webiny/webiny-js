import type { IScheduleRecord } from "~/scheduler/types.js";

export interface IHandlerAction {
    canHandle(record: IScheduleRecord): boolean;
    handle(record: IScheduleRecord): Promise<void>;
}
