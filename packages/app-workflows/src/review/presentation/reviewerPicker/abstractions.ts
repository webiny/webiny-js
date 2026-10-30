import { createAbstraction } from "@webiny/feature/admin";
import type { StepCandidate } from "~/review/domain/types.js";

export interface ReviewerPickerInitParams {
    load: () => Promise<StepCandidate[]>;
    currentOwnerId: string | null;
    selectedId: string | null;
}

export interface ReviewerPickerOptionVm {
    label: string;
    value: string;
    disabled: boolean;
    initials: string;
    // The member's team names, joined; "" when none.
    teams: string;
    // "Current owner" or "Unavailable[: reason]"; null for a selectable person.
    note: string | null;
}

// Render-ready (R234). `eligibleCount` counts selectable people, ignoring the search.
export interface IReviewerPickerViewModel {
    options: ReviewerPickerOptionVm[];
    value: string | null;
    loading: boolean;
    error: string | null;
    query: string;
    emptyMessage: string;
    eligibleCount: number;
}

export interface IReviewerPickerPresenter {
    readonly vm: IReviewerPickerViewModel;
    init(params: ReviewerPickerInitParams): Promise<void>;
    search(query: string): void;
    select(id: string): void;
    retry(): Promise<void>;
    dispose(): void;
}

export const ReviewerPickerPresenter = createAbstraction<IReviewerPickerPresenter>(
    "Workflows/ReviewerPickerPresenter"
);

export namespace ReviewerPickerPresenter {
    export type Interface = IReviewerPickerPresenter;
    export type ViewModel = IReviewerPickerViewModel;
}
