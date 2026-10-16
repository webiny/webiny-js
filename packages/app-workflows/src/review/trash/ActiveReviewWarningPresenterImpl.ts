import { makeAutoObservable } from "mobx";
import { ActiveReviewWarningPresenter as Abstraction } from "./ActiveReviewWarningPresenter.js";
import type { ActiveReviewWarningInitParams } from "./ActiveReviewWarningPresenter.js";
import type { ActiveReviewWarningViewModel } from "./ActiveReviewWarningPresenter.js";

const CONFIRM_FAILED = "The server did not respond, so nothing was changed. Try again.";

class ActiveReviewWarningPresenterImpl implements Abstraction.Interface {
    private title = "";
    private body = "";
    private reviews: string[] = [];
    private busy = false;
    private error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get vm(): ActiveReviewWarningViewModel {
        const reviews = this.reviews.map(text => ({ text }));

        return {
            title: this.title,
            body: this.body,
            reviews,
            busy: this.busy,
            error: this.error
        };
    }

    init(params: ActiveReviewWarningInitParams): void {
        this.title = params.title;
        this.body = params.body;
        this.reviews = params.reviews;
        this.busy = false;
        this.error = null;
    }

    async confirm(onConfirm: () => Promise<void>): Promise<boolean> {
        if (this.busy) {
            return false;
        }

        this.startConfirm();

        try {
            await onConfirm();
            this.finishConfirm();
            return true;
        } catch {
            this.failConfirm();
            return false;
        }
    }

    dismiss(): boolean {
        return !this.busy;
    }

    dispose(): void {
        this.title = "";
        this.body = "";
        this.reviews = [];
        this.busy = false;
        this.error = null;
    }

    private startConfirm(): void {
        this.busy = true;
        this.error = null;
    }

    private finishConfirm(): void {
        this.busy = false;
    }

    private failConfirm(): void {
        this.busy = false;
        this.error = CONFIRM_FAILED;
    }
}

export const ActiveReviewWarningPresenter = Abstraction.createImplementation({
    implementation: ActiveReviewWarningPresenterImpl,
    dependencies: []
});
