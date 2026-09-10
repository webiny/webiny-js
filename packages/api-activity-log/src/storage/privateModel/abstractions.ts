import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IActivityLogModelProvider {
    get(): Promise<CmsModel>;
}

/** Resolves the tenant's activity log model on demand. */
export const ActivityLogModelProvider = createAbstraction<IActivityLogModelProvider>(
    "ActivityLog/ModelProvider"
);

export namespace ActivityLogModelProvider {
    export type Interface = IActivityLogModelProvider;
}

/** Values as they are stored on the private model entry. */
export interface ActivityRecordValues {
    targetType: string;
    targetId: string;
    revision: string;
    timestamp: string;
    actorId: string;
    actorType: string;
    actorDisplayName: string | null;
    action: string;
    source: string;
    correlationId: string;
    changeset: unknown;
    truncated: boolean;
}
