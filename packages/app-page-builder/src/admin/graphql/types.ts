import { PbErrorResponse } from "~/types";
// a copy of values from the @webiny/tasks/types.ts TaskDataStatus enum
export enum PbTaskStatus {
    pending = "pending",
    running = "running",
    failed = "failed",
    success = "success",
    aborted = "aborted"
}

export interface CreatedBy {
    id: string;
    type: string;
    displayName: string | null;
}

export enum PbPageStatuses {
    published = "published",
    unpublished = "unpublished",
    draft = "draft"
}

export enum PbTagsRule {
    all = "all",
    any = "any"
}

export interface PbListPagesWhereTagsInput {
    query?: string[];
    rule?: PbTagsRule;
}

export interface PbListPagesWhereInput {
    pid_in?: string[];
    category?: string;
    status?: PbPageStatuses;
    tags?: PbListPagesWhereTagsInput;
}

export interface PbListPagesSearchInput {
    query?: string;
}

export interface PbImportExportTaskData {
    url?: string;
    error?: PbErrorResponse;
}
