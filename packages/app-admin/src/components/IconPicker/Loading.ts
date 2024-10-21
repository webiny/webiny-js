import { makeAutoObservable } from "mobx";

export class Loading {
    private _isLoading: boolean;
    private _loadingLabel: string;
    private _feedback: string;
    private _success: boolean;

    constructor(isLoading = false) {
        this._isLoading = isLoading;
        this._loadingLabel = "";
        this._feedback = "";
        this._success = false;
        makeAutoObservable(this);
    }

    startLoading(label?: string) {
        this._isLoading = true;
        this._loadingLabel = label || "";
        this._feedback = "";
        this._success = false;
    }

    stopLoadingWithSuccess(message?: string) {
        this._isLoading = false;
        this._loadingLabel = "";
        this._feedback = message || "";
        this._success = true;
    }

    stopLoadingWithError(message?: string) {
        this._isLoading = false;
        this._loadingLabel = "";
        this._feedback = message || "";
        this._success = false;
    }

    get isLoading() {
        return this._isLoading;
    }

    get loadingLabel() {
        return this._loadingLabel;
    }

    get feedback() {
        return this._feedback;
    }

    async runCallbackWithLoading<T>(
        callback: () => Promise<T>,
        loadingLabel?: string,
        successMessage?: string,
        failureMessage?: string
    ): Promise<T> {
        try {
            this.startLoading(loadingLabel);
            const result = await callback();
            this.stopLoadingWithSuccess(successMessage);
            return result;
        } catch (e) {
            this.stopLoadingWithError(e.message || failureMessage);
            throw e;
        }
    }
}
