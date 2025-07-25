import type { CmsIdentity, CmsModel, SchedulerEntry } from "~/types";
import { ScheduleType } from "~/types";

export class SchedulerItem {
    public readonly id: string;
    public readonly title: string;
    public readonly type: ScheduleType;
    public readonly targetId: string;
    public readonly model: Pick<CmsModel, "modelId">;
    public readonly scheduledBy: CmsIdentity;
    public readonly publishOn?: Date;
    public readonly unpublishOn?: Date;

    protected constructor(item: SchedulerEntry) {
        this.id = item.id;
        this.title = item.title;
        this.type = item.type;
        this.targetId = item.targetId;
        this.model = item.model;
        this.scheduledBy = item.scheduledBy;
        this.publishOn = item.publishOn;
        this.unpublishOn = item.unpublishOn;
    }

    public static create(item: SchedulerEntry) {
        return new SchedulerItem(item);
    }
}
