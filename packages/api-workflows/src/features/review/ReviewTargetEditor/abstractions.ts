import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewTargetEditorError } from "~/domain/review/errors.js";

export interface ReviewTargetEditorField {
    /** The key `update` takes: a field id, or dotted ids for a nested object (`address.street`). */
    path: string;
    label: string;
    /** The target's own field type, e.g. "text", "long-text", "number", "object". */
    type: string;
    value: unknown;
    /** Whether `update` accepts this path (R172). The model is told, so it does not try the rest. */
    writable: boolean;
}

export interface ReviewTargetContent {
    title: string;
    fields: ReviewTargetEditorField[];
}

export interface ReviewTargetEditorReadParams {
    /** Namespace id, e.g. "cms.article" or "wb.page" (D41). */
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface ReviewTargetEditorUpdateParams extends ReviewTargetEditorReadParams {
    /** The new values by field path, as read. */
    values: Record<string, unknown>;
}

export interface ReviewTargetEditorUpdateResult {
    /** The paths that were written. */
    applied: string[];
}

export interface IReviewTargetEditor {
    /** Whether this editor handles the namespace id, e.g. "cms.article" or "wb.page". */
    canEdit(model: string): boolean;
    /**
     * The whole content under review, every field with `writable`. Fails with a
     * `ReviewTargetEditorError` (target not found, not readable); never throws.
     */
    read(
        params: ReviewTargetEditorReadParams
    ): Promise<Result<ReviewTargetContent, ReviewTargetEditorError>>;
    /**
     * Writes the bounded set of fields (R172), atomically: any path that is unknown or read-only,
     * or any value the target rejects, fails the whole call and writes nothing. It does not check
     * permissions or stale state and does not apply the bypass: the tool that calls it does (R173).
     * Never throws; a non-validation failure is logged by the adapter and answered with a generic
     * message.
     */
    update(
        params: ReviewTargetEditorUpdateParams
    ): Promise<Result<ReviewTargetEditorUpdateResult, ReviewTargetEditorError>>;
}

/**
 * Reads and writes the content under review for the AI tools (spec 9.3). One implementation per
 * namespace, registered by the app target adapters (`cms.*`, `wb.page`); the last registered match
 * wins (A10). The engine reaches it only through `ReviewTargetEditorService`.
 */
export const ReviewTargetEditor = createAbstraction<IReviewTargetEditor>("ReviewTargetEditor");

export namespace ReviewTargetEditor {
    export type Interface = IReviewTargetEditor;
    export type Field = ReviewTargetEditorField;
    export type Content = ReviewTargetContent;
    export type ReadParams = ReviewTargetEditorReadParams;
    export type UpdateParams = ReviewTargetEditorUpdateParams;
    export type UpdateResult = ReviewTargetEditorUpdateResult;
}
