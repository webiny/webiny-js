import { createAbstraction } from "@webiny/feature/admin";

export interface ActiveReviewWarningLine {
    text: string;
}

export interface ActiveReviewWarningViewModel {
    title: string;
    body: string;
    reviews: ActiveReviewWarningLine[];
    busy: boolean;
    error: string | null;
}

export interface ActiveReviewWarningInitParams {
    title: string;
    body: string;
    reviews: string[];
}

export interface IActiveReviewWarningPresenter {
    readonly vm: ActiveReviewWarningViewModel;
    init(params: ActiveReviewWarningInitParams): void;
    /*
     * Runs the dialog's confirm. Resolves true when it finished, false when it threw (the error
     * is then in the view model) or when a confirm is already running.
     */
    confirm(onConfirm: () => Promise<void>): Promise<boolean>;
    /*
     * True when dismissing is allowed (not while a confirm is running).
     */
    dismiss(): boolean;
    dispose(): void;
}

export const ActiveReviewWarningPresenter = createAbstraction<IActiveReviewWarningPresenter>(
    "Workflows/ActiveReviewWarningPresenter"
);

export namespace ActiveReviewWarningPresenter {
    export type Interface = IActiveReviewWarningPresenter;
    export type ViewModel = ActiveReviewWarningViewModel;
    export type InitParams = ActiveReviewWarningInitParams;
}
