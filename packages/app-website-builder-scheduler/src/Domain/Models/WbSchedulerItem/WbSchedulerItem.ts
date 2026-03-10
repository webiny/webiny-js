import type { WbSchedulerEntry } from "~/types.js";
import type { ScheduleType } from "~/types.js";

export class WbSchedulerItem {
    public readonly id: string;
    public readonly title: string;
    public readonly type: ScheduleType;
    public readonly targetId: string;
    public readonly scheduledBy: WbSchedulerEntry["scheduledBy"];
    public readonly publishOn?: Date;
    public readonly unpublishOn?: Date;

    protected constructor(item: WbSchedulerEntry) {
        this.id = item.id;
        this.title = item.title;
        this.type = item.type;
        this.targetId = item.targetId;
        this.scheduledBy = item.scheduledBy;
        this.publishOn = item.publishOn;
        this.unpublishOn = item.unpublishOn;
    }

    public static create(item: WbSchedulerEntry) {
        return new WbSchedulerItem(item);
    }
}
