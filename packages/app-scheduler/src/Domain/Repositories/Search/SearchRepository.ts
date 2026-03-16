import { makeAutoObservable } from "mobx";
import type { ISearchRepository } from "./ISearchRepository.js";

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
