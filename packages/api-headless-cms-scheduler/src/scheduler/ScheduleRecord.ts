import type { IScheduleEntryValues, IScheduleRecord } from "~/scheduler/types.js";
import type { CmsEntry, CmsIdentity, CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IScheduleRecordParams {
    id: string;
    targetId: string;
    model: CmsModel;
    scheduledBy: CmsIdentity;
    scheduledOn: Date;
    dateOn: Date;
    type: "publish" | "unpublish";
    title: string;
}

export class ScheduleRecord implements IScheduleRecord {
    public readonly id: string;
    public readonly targetId: string;
    public readonly model: CmsModel;
    public readonly scheduledBy: CmsIdentity;
    public readonly publishOn: Date | undefined;
    public readonly unpublishOn: Date | undefined;
    public readonly type: "publish" | "unpublish";
    public readonly title: string;

    public constructor(record: IScheduleRecordParams) {
        this.id = record.id;
        this.targetId = record.targetId;
        this.model = record.model;
        this.scheduledBy = record.scheduledBy;
        this.publishOn = record.type === "publish" ? record.dateOn : undefined;
        this.unpublishOn = record.type === "unpublish" ? record.dateOn : undefined;
        this.type = record.type;
        this.title = record.title;
    }
}

export const createScheduleRecord = (record: IScheduleRecordParams): IScheduleRecord => {
    return new ScheduleRecord(record);
};

export const transformScheduleEntry = (
    targetModel: CmsModel,
    entry: CmsEntry<IScheduleEntryValues>
): IScheduleRecord => {
    return createScheduleRecord({
        id: entry.id,
        type: entry.values.type,
        title: entry.values.title,
        targetId: entry.values.targetId,
        scheduledOn: new Date(entry.savedOn),
        dateOn: new Date(entry.values.dateOn),
        scheduledBy: entry.savedBy,
        model: targetModel
    });
};
