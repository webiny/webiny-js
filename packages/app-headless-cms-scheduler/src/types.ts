import type { CmsIdentity, CmsModel } from "@webiny/app-headless-cms-common/types";

export enum ScheduleType {
    publish = "publish",
    unpublish = "unpublish"
}

export interface ScheduleEntry {
    id: string;
    targetId: string;
    model: CmsModel;
    scheduledBy: CmsIdentity;
    publishOn?: Date;
    unpublishOn?: Date;
    type: ScheduleType;
    title: string;
}
