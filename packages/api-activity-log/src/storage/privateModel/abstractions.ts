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
    /**
     * Sort and pagination key, unique per record and lexicographically ordered by time.
     *
     * An implementation detail of this adapter, deliberately absent from `ActivityRecord`. It
     * exists because paging this dataset needs a key that cannot tie: the timestamp has
     * millisecond precision and a bulk action writes many records inside one millisecond, so a
     * timestamp keyset would silently drop records at a page boundary.
     */
    sequence: string;
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
