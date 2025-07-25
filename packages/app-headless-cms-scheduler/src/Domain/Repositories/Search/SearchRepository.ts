import { makeAutoObservable } from "mobx";
import { ISearchRepository } from "./ISearchRepository";

export class SearchRepository implements ISearchRepository {
    private query = "";

    constructor() {
        makeAutoObservable(this);
    }

    get() {
        return this.query;
    }

    async set(query: string) {
        this.query = query;
    }
}
