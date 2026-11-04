import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { AssignmentRecord, AssignmentRecordKind, AssignmentRecordValues } from "../types.js";
import type { AssignmentPersistenceError } from "../errors.js";

/**
 * Filters combine with AND; omitted (`undefined`) filters do not restrict, an empty string is a
 * real filter value. An empty `reviewId_in`, `userId_in` or `workflowId_in` matches nothing. Pool
 * records (`userId` null) are reachable only via the `reviewId`, `workflowId` and `stepId`
 * filters.
 */
export interface AssignmentRepositoryListWhere {
    reviewId?: string;
    /** Records of any of these reviews (deleting the reviews of deleted targets). */
    reviewId_in?: string[];
    workflowId?: string;
    /** Records of any of these workflows (least-loaded tie-break per app, D137). */
    workflowId_in?: string[];
    stepId?: string;
    userId?: string;
    /** Records of any of these users (least-loaded tie-break: latest record per candidate, D20). */
    userId_in?: string[];
    /** Only records with a user (`true`): pool outcomes and skips without one are left out. */
    hasUser?: boolean;
    /**
     * Only outcomes (who got a step) or only skips (R115). Matches the stored `kind`: records
     * stored without one (read as outcomes, R96) are not matched. The model is unreleased, so
     * such records do not exist outside old test data.
     */
    kind?: AssignmentRecordKind;
}

export interface AssignmentRepositoryListParams {
    where: AssignmentRepositoryListWhere;
    /** Page size; default 100. */
    limit?: number;
    /** `meta.cursor` of the previous page. */
    after?: string | null;
}

export interface AssignmentRepositoryListResult {
    items: AssignmentRecord[];
    meta: CmsEntryMeta;
}

export interface IAssignmentRepository {
    create(
        values: AssignmentRecordValues
    ): Promise<Result<AssignmentRecord, AssignmentPersistenceError>>;
    /** Newest `assignedOn` first, across pages. */
    list(
        params: AssignmentRepositoryListParams
    ): Promise<Result<AssignmentRepositoryListResult, AssignmentPersistenceError>>;
    /**
     * Permanently deletes records (with their reviews, spec 4.3), in batches of the CMS
     * delete-multiple limit; a missing record counts as deleted. Stops at the first failed batch.
     */
    deleteMany(ids: string[]): Promise<Result<void, AssignmentPersistenceError>>;
}

/** The assignment log (`wbyWorkflowAssignment`). */
export const AssignmentRepository =
    createAbstraction<IAssignmentRepository>("AssignmentRepository");

export namespace AssignmentRepository {
    export type Interface = IAssignmentRepository;
    export type ListParams = AssignmentRepositoryListParams;
    export type ListWhere = AssignmentRepositoryListWhere;
    export type ListResult = AssignmentRepositoryListResult;
}
