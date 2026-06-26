import { makeAutoObservable, runInAction } from "mobx";
import type { SearchContentEntriesUseCase } from "~/features/contentEntry/searchContentEntries/abstractions.js";
import type { GetContentEntriesUseCase } from "~/features/contentEntry/getContentEntries/abstractions.js";
import type { IRefEntryOption } from "./abstractions.js";
import { toOption } from "./toOption.js";

export class BaseAutocompletePresenter {
    loading = false;
    defaultOptions: IRefEntryOption[] = [];
    searchOptions: IRefEntryOption[] = [];
    modelIds: string[] = [];
    searchQuery = "";

    constructor(
        private searchUseCase: SearchContentEntriesUseCase.Interface,
        private getEntriesUseCase: GetContentEntriesUseCase.Interface
    ) {
        makeAutoObservable<BaseAutocompletePresenter, "searchUseCase" | "getEntriesUseCase">(this, {
            searchUseCase: false,
            getEntriesUseCase: false
        });
    }

    get activeOptions(): IRefEntryOption[] {
        return this.searchQuery ? this.searchOptions : this.defaultOptions;
    }

    async search(query: string): Promise<void> {
        this.searchQuery = query;
        if (!query) {
            this.searchOptions = [];
            return;
        }

        this.loading = true;
        try {
            const result = await this.searchUseCase.execute({
                modelIds: this.modelIds,
                query,
                limit: 10
            });
            runInAction(() => {
                this.searchOptions = result.data.map(toOption);
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async loadDefaults(): Promise<void> {
        this.loading = true;
        try {
            const result = await this.searchUseCase.execute({
                modelIds: this.modelIds,
                limit: 10
            });
            runInAction(() => {
                this.defaultOptions = result.data.map(toOption);
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async resolveEntries(values: { id: string; modelId: string }[]): Promise<IRefEntryOption[]> {
        this.loading = true;
        try {
            const result = await this.getEntriesUseCase.execute({
                entries: values.map(v => ({ id: v.id, modelId: v.modelId }))
            });
            const options = result.latest.map(toOption);
            runInAction(() => {
                this.loading = false;
            });
            return options;
        } catch (e) {
            runInAction(() => {
                this.loading = false;
            });
            throw e;
        }
    }

    clearSearch(): void {
        this.searchQuery = "";
        this.searchOptions = [];
    }
}
