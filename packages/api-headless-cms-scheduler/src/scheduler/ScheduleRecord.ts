import {
    type IScheduleEntryValues,
    type IScheduleRecord,
    type ScheduledOnType,
    ScheduleType
} from "~/scheduler/types.js";
import type { CmsEntry, CmsIdentity, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { WebinyError } from "@webiny/error";

export interface IScheduleRecordParams {
    id: string;
    targetId: string;
    model: CmsModel;
    scheduledBy: CmsIdentity;
    /**
     * The date when the schedule is to be executed.
     */
    scheduledOn: ScheduledOnType;
    /**
     * The date when the action is to be set as done.
     * User can set publishedOn (and other relevant dates) with this parameter.
     */
    // dateOn: DateOnType | undefined;
    type: ScheduleType;
    title: string;
}

export class ScheduleRecord implements IScheduleRecord {
    public readonly id: string;
    public readonly targetId: string;
    public readonly model: CmsModel;
    public readonly scheduledBy: CmsIdentity;
    public readonly publishOn: ScheduledOnType | undefined;
    public readonly unpublishOn: ScheduledOnType | undefined;
    // public readonly dateOn: DateOnType | undefined;
    public readonly type: ScheduleType;
    public readonly title: string;

    public constructor(record: IScheduleRecordParams) {
        this.id = record.id;
        this.targetId = record.targetId;
        this.model = record.model;
        this.scheduledBy = record.scheduledBy;
        // this.dateOn = record.dateOn;
        this.publishOn = record.type === ScheduleType.publish ? record.scheduledOn : undefined;
        this.unpublishOn = record.type === ScheduleType.unpublish ? record.scheduledOn : undefined;
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
    let type: ScheduleType;
    switch (entry.values.type) {
        case ScheduleType.publish:
            type = ScheduleType.publish;
            break;
        case ScheduleType.unpublish:
            type = ScheduleType.unpublish;
            break;
        default:
            throw new WebinyError(
                `Unsupported schedule type "${entry.values.type}".`,
                "UNSUPPORTED_SCHEDULE_TYPE",
                {
                    type: entry.values.type,
                    entry
                }
            );
    }
    return createScheduleRecord({
        id: entry.id,
        type,
        title: entry.values.title,
        targetId: entry.values.targetId,
        scheduledOn: new Date(entry.values.scheduledOn),
        // dateOn: isoStringToDate(entry.values.dateOn),
        scheduledBy: entry.savedBy,
        model: targetModel
    });
};
