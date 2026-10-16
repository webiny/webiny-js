import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";

export type ReviewWidgetKind = "forMe" | "myRequests";

export type ReviewWidgetTab = "assignedToMe" | "pool";

export type ReviewWidgetStatus = "loading" | "ready" | "failed";

export interface ReviewWidgetInitParams {
    useCases: IReviewListUseCases;
    namespaces: string[];
    kind: ReviewWidgetKind;
    rowProvider: IReviewRowProvider;
}

export interface ReviewWidgetRowVm {
    reviewId: string;
    title: string;
    stepLine: string;
    stateLabel: string;
    stateVariant: TargetReviewTagVariant;
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
