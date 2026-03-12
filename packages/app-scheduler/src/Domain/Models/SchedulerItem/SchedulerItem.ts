import type { SchedulerIdentity, SchedulerEntry, ScheduleType } from "~/types.js";

export class SchedulerItem {
    public readonly id: string;
    public readonly title: string;
    public readonly type: ScheduleType;
    public readonly targetId: string;
    public readonly namespace: string;
    public readonly scheduledBy: SchedulerIdentity;
    public readonly publishOn?: Date;
    public readonly unpublishOn?: Date;

    protected constructor(item: SchedulerEntry) {
        this.id = item.id;
        this.title = item.title;
        this.type = item.type;
        this.targetId = item.targetId;
        this.namespace = item.namespace;
        this.scheduledBy = item.scheduledBy;
        this.publishOn = item.publishOn;
        this.unpublishOn = item.unpublishOn;
    }

    public static create(item: SchedulerEntry) {
        return new SchedulerItem(item);
    }
}
