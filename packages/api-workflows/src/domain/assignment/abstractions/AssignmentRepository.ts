import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { AssignmentRecord, AssignmentRecordValues } from "../types.js";
import type { AssignmentPersistenceError } from "../errors.js";

/** Filters combine with AND; omitted filters do not restrict. */
export interface AssignmentRepositoryListWhere {
    reviewId?: string;
    workflowId?: string;
    stepId?: string;
    userId?: string;
    /** Records of any of these users (phase 4: latest record per candidate, D20). */
    userId_in?: string[];
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
