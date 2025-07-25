import { makeAutoObservable } from "mobx";
import { ISearchRepository } from "./ISearchRepository";

export class SearchRepository implements ISearchRepository {
    private query = "";

    public constructor() {
        makeAutoObservable(this);
    }

    public get() {
        return this.query;
    }

    public async set(query: string) {
        this.query = query;
    }
}
