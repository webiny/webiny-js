import { makeAutoObservable } from "mobx";
import { Feedback } from "./Feedback";

export class Loading {
    private feedback: Feedback;
    private _isLoading: boolean;
    private _loadingLabel: string;
    private success: boolean;

    constructor(feedback: Feedback) {
        this.feedback = feedback;
        this._isLoading = false;
        this._loadingLabel = "";
        this.success = false;
        makeAutoObservable(this);
    }

    setLoading(label?: string) {
        this._isLoading = true;
        this._loadingLabel = label || "";
        this.success = false;
        this.feedback.message = "";
    }

    setLoadSuccess(message?: string) {
        this._isLoading = false;
        this._loadingLabel = "";
        this.success = true;
        this.feedback.message = message || "";
    }

    setLoadError(message?: string) {
        this._isLoading = true;
        this._loadingLabel = "";
        this.success = false;
        this.feedback.message = message || "";
    }

    get isLoading() {
        return this._isLoading;
    }

    get loadingLabel() {
        return this._loadingLabel;
    }

    async runCallbackWithLoading(
        callback: Promise<void>,
        loadingLabel?: string,
        successMessage?: string,
        failureMessage?: string
    ) {
        try {
            this.setLoading(loadingLabel);
            await callback;
            this.setLoadSuccess(successMessage);
        } catch (e) {
            this.setLoadError(e.message || failureMessage);
        }
    }
}
