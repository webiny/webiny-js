import omitBy from "lodash/omitBy";
import { makeAutoObservable } from "mobx";
import type { IFilterRepository } from "./IFilterRepository.js";

export class FilterRepository implements IFilterRepository {
    private filters: Record<string, any> = {};

    constructor() {
        makeAutoObservable(this);
    }

    public get() {
        return this.filters;
    }

    public hasFilters() {
        const filters = this.removeEmptyFilters(this.filters);
        return Object.keys(filters).length > 0;
    }

    public async set(filters: Record<string, any>) {
        this.filters = this.removeEmptyFilters(filters);
    }

    public async reset() {
        this.filters = {};
    }

    private removeEmptyFilters(filters: Record<string, any>) {
        return omitBy(filters, value => value === null || value === undefined || value === "");
    }
}
