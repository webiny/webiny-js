import type { IScheduledAction, IScheduledActionEntry } from "~/shared/abstractions.js";
import type { GenericRecord } from "@webiny/api/types.js";
export declare class ScheduledActionMapper {
    static toAction<T extends GenericRecord = GenericRecord>(action: IScheduledActionEntry<T>): IScheduledAction<T>;
    static toActions<T extends GenericRecord = GenericRecord>(actions: IScheduledActionEntry<T>[]): IScheduledAction<T>[];
    static toGraphQL<T extends GenericRecord = GenericRecord>(action: IScheduledAction<T>): {
        id: string;
        targetId: string;
        namespace: string;
        scheduledBy: import("~/shared/abstractions.js").Identity;
        publishOn: Date | null;
        unpublishOn: Date | null;
        actionType: import("~/shared/abstractions.js").ScheduledActionType;
        title: string;
    };
}
