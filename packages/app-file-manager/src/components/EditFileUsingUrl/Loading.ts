import { makeAutoObservable } from "mobx";

export enum LOADING_STATE {
    IDLE = "IDLE",
    GET_FILE = "GET_FILE",
    UPDATE_FILE = "UPDATE_FILE",
    ERROR = "ERROR"
}

export class Loading {
    private _isLoading: boolean;
    private _state: LOADING_STATE;
    private _feedback: string;

    constructor() {
        this._isLoading = false;
        this._state = LOADING_STATE.IDLE;
        this._feedback = "";
        makeAutoObservable(this);
    }

    startLoading(state: LOADING_STATE) {
        this._isLoading = true;
        this._state = state;
        this._feedback = "";
    }

    stopLoadingWithSuccess(message?: string) {
        this._isLoading = false;
        this._state = LOADING_STATE.IDLE;
        this._feedback = message || "";
    }

    stopLoadingWithError(message?: string) {
        this._isLoading = false;
        this._state = LOADING_STATE.ERROR;
        this._feedback = message || "";
    }

    get isLoading() {
        return this._isLoading;
    }

    get state() {
        return this._state;
    }

    get feedback() {
        return this._feedback;
    }
}
