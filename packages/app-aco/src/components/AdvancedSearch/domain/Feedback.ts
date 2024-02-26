import { makeAutoObservable } from "mobx";

export class Feedback {
    private _message: string;

    constructor() {
        this._message = "";
        makeAutoObservable(this);
    }

    get message() {
        return this._message;
    }

    set message(value: string) {
        this._message = value;
    }
}
