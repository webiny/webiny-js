import type { SystemWorkflowValue } from "~/review/domain/types.js";

export interface ReviewCacheRef {
    namespace: string;
    targetId: string;
    targetRevisionId: string;
}

// Writes `meta.system.workflow` into an app's content list cache (R213).
export interface IReviewCacheWriter {
    canHandle(namespace: string): boolean;
    write(ref: ReviewCacheRef, workflow: SystemWorkflowValue | null): void;
}
