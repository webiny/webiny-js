import type React from "react";
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewContentRef } from "~/review/content/IReviewContentAdapter.js";
import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";
import type { ReviewActionKind } from "~/review/presentation/actionDialog/ReviewActionKind.js";
import type { TargetReviewActionVm } from "~/review/presentation/targetReview/abstractions.js";
import type { TargetReviewTagIcon } from "~/review/presentation/targetReview/abstractions.js";
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";

/*
 * What the list needs to know about one app for the rows of its namespace: the content URL and
 * the content type label. Row actions and the details drawer run on the row's namespace (R353).
 */
export interface IReviewRowBinding {
    getContentUrl(ref: ReviewContentRef): string;
    getContentTypeLabel(contentTypeId: string): string | null;
    renderContentTypeIcon(contentTypeId: string): React.ReactNode;
}

/*
 * Resolves the binding of a row's namespace. A namespace nobody binds returns `null` and its rows
 * render without a link and without actions (R206). A future global list passes a provider over
 * several apps.
 */
export interface IReviewRowProvider {
    getBinding(namespace: string): IReviewRowBinding | null;
}

export interface ReviewListScopeVm {
    value: ReviewListScope;
    label: string;
}

export interface ReviewListStateVm {
    value: ReviewListState;
    label: string;
    // Empty by definition for the chosen scope (`isEmptyReviewListFilter`): shown, not chosen.
    disabled: boolean;
}

// The column a list sorts by; the table toggles the direction of the active one.
export type ReviewListSortField = "title" | "lastChangedOn";

export type ReviewListStatus = "loading" | "ready" | "failed";

export type ReviewListDialogKind = "details" | ReviewActionKind;

export interface ReviewListInitParams {
    // The app whose reviews the list shows; the list use case routes by it (R348).
    app: WorkflowAppKind;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    // From the route; an invalid or unavailable value falls back to the default.
    initialScope: ReviewListScope | null;
    initialState: ReviewListState | null;
    // Whether the list shows the content type column and filter (CMS); the filtered empty copy names it.
    showContentType: boolean;
}

export interface ReviewListRowVm {
    reviewId: string;
    namespace: string;
    title: string;
    reviewStateLabel: string;
    stepTitle: string | null;
    stepColor: string | null;
    stepStateLabel: string | null;
    stepStateVariant: TargetReviewTagVariant;
    stepStateIcon: TargetReviewTagIcon | null;
    ownerLabel: string | null;
    requesterName: string;
    lastChange: string;
    contentTypeLabel: string | null;
    contentTypeIcon: React.ReactNode;
    contentTypeApp: string;
    contentUrl: string | null;
    highlighted: boolean;
    actions: TargetReviewActionVm[];
}

export interface ReviewListEmptyVm {
    title: string;
    description: string;
}

export interface ReviewListDialogVm {
    kind: ReviewListDialogKind;
    namespace: string;
    reviewId: string;
    stepId: string | null;
}

export interface IReviewListViewModel {
    scope: ReviewListScope;
    // The scopes this viewer may open (All only with `reassign` or full access, R259).
    scopes: ReviewListScopeVm[];
    state: ReviewListState;
    states: ReviewListStateVm[];
    rows: ReviewListRowVm[];
    status: ReviewListStatus;
    loadingMore: boolean;
    hasMore: boolean;
    sort: ReviewListSort;
    search: string;
    searchDraft: string;
    contentTypeId: string | null;
    notice: string | null;
    error: string | null;
    empty: ReviewListEmptyVm | null;
    isFiltered: boolean;
    dialog: ReviewListDialogVm | null;
}

export interface IReviewListPresenter {
    readonly vm: IReviewListViewModel;
    init(params: ReviewListInitParams): Promise<void>;
    setScope(scope: ReviewListScope): Promise<void>;
    setState(state: ReviewListState): Promise<void>;
    setSearchDraft(search: string): void;
    setSearch(search: string): Promise<void>;
    setContentType(contentTypeId: string | null): Promise<void>;
    // The active field flips its direction; another field becomes the only sort, ascending.
    toggleSort(field: ReviewListSortField): Promise<void>;
    loadMore(): Promise<void>;
    refresh(): Promise<void>;
    showNewReviews(): Promise<void>;
    clearFilters(): Promise<void>;
    openRowAction(
        reviewId: string,
        kind: TargetReviewActionVm["kind"],
        stepId: string | null
    ): void;
    openDetails(reviewId: string): void;
    closeDialog(): void;
    actionDone(): void;
    dispose(): void;
}

export const ReviewListPresenter = createAbstraction<IReviewListPresenter>(
    "Workflows/ReviewListPresenter"
);

export namespace ReviewListPresenter {
    export type Interface = IReviewListPresenter;
    export type ViewModel = IReviewListViewModel;
}
