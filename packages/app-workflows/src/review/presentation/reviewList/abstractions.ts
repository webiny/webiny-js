import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewContentRef } from "~/review/content/IReviewContentAdapter.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
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
}

/*
 * Resolves the binding of a row's namespace. A namespace nobody binds returns `null` and its rows
 * render without a link and without actions (R206). A future global list passes a provider over
 * several apps.
 */
export interface IReviewRowProvider {
    getBinding(namespace: string): IReviewRowBinding | null;
}

export type ReviewListTab = "assignedToMe" | "pool" | "teamInReview" | "myRequests" | "failedSteps";

export interface ReviewListTabVm {
    value: ReviewListTab;
    label: string;
}

export type ReviewListStatus = "loading" | "ready" | "failed";

export type ReviewListDialogKind = "details" | ReviewActionKind;

export interface ReviewListInitParams {
    // The app whose reviews the list shows; the list use case routes by it (R348).
    app: WorkflowAppKind;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    initialTab: ReviewListTab;
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
    contentTypeApp: string;
    contentUrl: string | null;
    leaving: boolean;
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
    tab: ReviewListTab;
    // The tabs this viewer may open (Failed steps only with `reassign` or full access, R259).
    tabs: ReviewListTabVm[];
    rows: ReviewListRowVm[];
    status: ReviewListStatus;
    loadingMore: boolean;
    hasMore: boolean;
    sort: ReviewListSort;
    search: string;
    searchDraft: string;
    contentTypeId: string | null;
    reviewState: ReviewStateValue | null;
    stepState: StepStateValue | null;
    notice: string | null;
    error: string | null;
    empty: ReviewListEmptyVm | null;
    isFiltered: boolean;
    dialog: ReviewListDialogVm | null;
}

export interface IReviewListPresenter {
    readonly vm: IReviewListViewModel;
    init(params: ReviewListInitParams): Promise<void>;
    setTab(tab: ReviewListTab): Promise<void>;
    setSearchDraft(search: string): void;
    setSearch(search: string): Promise<void>;
    setContentType(contentTypeId: string | null): Promise<void>;
    setReviewState(reviewState: ReviewStateValue | null): Promise<void>;
    setStepState(stepState: StepStateValue | null): Promise<void>;
    toggleSort(): Promise<void>;
    loadMore(): Promise<void>;
    refresh(): Promise<void>;
    showNewReviews(): Promise<void>;
    clearFilters(): Promise<void>;
    removeLeavingRow(reviewId: string): void;
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
