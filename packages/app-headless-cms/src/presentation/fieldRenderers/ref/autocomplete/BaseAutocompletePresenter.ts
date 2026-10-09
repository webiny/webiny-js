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
    private lastSearchId = 0;

    constructor(
        private searchUseCase: SearchContentEntriesUseCase.Interface,
        private getEntriesUseCase: GetContentEntriesUseCase.Interface
    ) {
        makeAutoObservable<
            BaseAutocompletePresenter,
            "searchUseCase" | "getEntriesUseCase" | "lastSearchId"
        >(this, {
            searchUseCase: false,
            getEntriesUseCase: false,
            lastSearchId: false
        });
    }

    get activeOptions(): IRefEntryOption[] {
        return this.searchQuery ? this.searchOptions : this.defaultOptions;
    }

    async search(query: string): Promise<void> {
        // Every keystroke starts a search, and responses can arrive out of order.
        // Only the latest search may write its results, or an older, shorter query overwrites them.
        const searchId = ++this.lastSearchId;
        this.searchQuery = query;
        if (!query) {
            this.searchOptions = [];
            this.loading = false;
            return;
        }

        this.loading = true;
        try {
            const result = await this.searchUseCase.execute({
                modelIds: this.modelIds,
                query,
                limit: 10
            });
            if (searchId !== this.lastSearchId) {
                return;
            }
            runInAction(() => {
                this.searchOptions = result.data.map(toOption);
            });
        } finally {
            if (searchId === this.lastSearchId) {
                runInAction(() => {
                    this.loading = false;
                });
            }
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
        this.lastSearchId++;
        this.searchQuery = "";
        this.searchOptions = [];
    }
}
