import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { TargetReviewTagIcon } from "~/review/presentation/targetReview/abstractions.js";
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";

export type ReviewWidgetKind = "forMe" | "myRequests";

export type ReviewWidgetTab = "assignedToMe" | "pool";

export type ReviewWidgetStatus = "loading" | "ready" | "failed";

export interface ReviewWidgetInitParams {
    // The app whose reviews the widget shows; the list use case routes by it (R348).
    app: WorkflowAppKind;
    namespaces: string[];
    kind: ReviewWidgetKind;
    rowProvider: IReviewRowProvider;
}

export interface ReviewWidgetRowVm {
    reviewId: string;
    title: string;
    // The current step's title and colour; both null for a row without a current step.
    stepTitle: string | null;
    stepColor: string | null;
    contentType: string | null;
    // The label of the app the review belongs to, e.g. "Headless CMS".
    app: string;
    stateLabel: string;
    stateVariant: TargetReviewTagVariant;
    stateIcon?: TargetReviewTagIcon;
    lastChange: string;
    contentUrl: string | null;
}

export interface IReviewWidgetViewModel {
    tab: ReviewWidgetTab | null;
    rows: ReviewWidgetRowVm[];
    status: ReviewWidgetStatus;
    empty: boolean;
    hasTeams: boolean;
}

export interface IReviewWidgetPresenter {
    readonly vm: IReviewWidgetViewModel;
    init(params: ReviewWidgetInitParams): Promise<void>;
    setTab(tab: ReviewWidgetTab): Promise<void>;
    refresh(): Promise<void>;
    dispose(): void;
}

export const ReviewWidgetPresenter = createAbstraction<IReviewWidgetPresenter>(
    "Workflows/ReviewWidgetPresenter"
);

export namespace ReviewWidgetPresenter {
    export type Interface = IReviewWidgetPresenter;
    export type ViewModel = IReviewWidgetViewModel;
}
