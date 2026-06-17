import { computed, makeAutoObservable, runInAction } from "mobx";
import { SearchContentEntriesUseCase } from "~/features/contentEntry/searchContentEntries/abstractions.js";
import { GetContentEntriesUseCase } from "~/features/contentEntry/getContentEntries/abstractions.js";
import type { CmsReferenceEntry, CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import {
    RefAutocompletePresenter as Abstraction,
    type IRefAutocompletePresenterInitConfig,
    type IRefAutocompleteViewModel,
    type IRefEntryOption
} from "./abstractions.js";

function toOption(entry: CmsReferenceEntry): IRefEntryOption {
    return {
        id: entry.id,
        entryId: entry.entryId,
        modelId: entry.model.modelId,
        modelName: entry.model.name,
        name: entry.title,
        status: entry.status,
        published: entry.published !== null
    };
}

class RefAutocompletePresenterImpl implements Abstraction.Interface {
    private _loading = false;
    private _defaultOptions: IRefEntryOption[] = [];
    private _searchOptions: IRefEntryOption[] = [];
    private _resolvedValue: IRefEntryOption | null = null;
    private _resolvedValues: IRefEntryOption[] = [];
    private _modelIds: string[] = [];
    private _searchQuery = "";

    constructor(
        private searchContentEntriesUseCase: SearchContentEntriesUseCase.Interface,
        private getContentEntriesUseCase: GetContentEntriesUseCase.Interface
    ) {
        makeAutoObservable<
            RefAutocompletePresenterImpl,
            "searchContentEntriesUseCase" | "getContentEntriesUseCase"
        >(this, {
            searchContentEntriesUseCase: false,
            getContentEntriesUseCase: false,
            vm: computed
        });
    }

    get vm(): IRefAutocompleteViewModel {
        const searchActive = this._searchQuery.length > 0;
        const baseOptions = searchActive ? this._searchOptions : this._defaultOptions;

        const seen = new Set<string>();
        const merged: IRefEntryOption[] = [];

        if (this._resolvedValue) {
            seen.add(this._resolvedValue.entryId);
            merged.push(this._resolvedValue);
        }

        for (const opt of this._resolvedValues) {
            if (!seen.has(opt.entryId)) {
                seen.add(opt.entryId);
                merged.push(opt);
            }
        }

        for (const opt of baseOptions) {
            if (!seen.has(opt.entryId)) {
                seen.add(opt.entryId);
                merged.push(opt);
            }
        }

        const dropdownOptions = merged.map(opt => ({
            label: opt.name,
            value: opt.entryId
        }));

        const singleValue = this._resolvedValue ? this._resolvedValue.entryId : undefined;

        const multipleEntryIds = this._resolvedValues.map(v => v.entryId);
        const canShowMultipleValues = this._resolvedValues.length > 0;

        return {
            loading: this._loading,
            dropdownOptions,
            singleValue,
            multipleValues: canShowMultipleValues ? multipleEntryIds : [],
            canShowMultipleValues,
            canReset: this._resolvedValue !== null
        };
    }

    async init(config: IRefAutocompletePresenterInitConfig): Promise<void> {
        this._modelIds = config.modelIds;
        await this.loadDefaults();
    }

    async search(query: string): Promise<void> {
        this._searchQuery = query;

        if (!query) {
            this._searchOptions = [];
            return;
        }

        this._loading = true;
        try {
            const result = await this.searchContentEntriesUseCase.execute({
                modelIds: this._modelIds,
                query,
                limit: 10
            });
            runInAction(() => {
                this._searchOptions = result.data.map(toOption);
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    selectValue(entryId: string): CmsReferenceValue | null {
        this._searchQuery = "";
        this._searchOptions = [];

        const all = this.getAllKnownOptions();
        const opt = all.find(o => o.entryId === entryId);
        if (!opt) {
            return null;
        }

        this._resolvedValue = opt;
        return { id: opt.id, modelId: opt.modelId };
    }

    selectValues(entryIds: string[]): CmsReferenceValue[] {
        this._searchQuery = "";
        this._searchOptions = [];

        const all = this.getAllKnownOptions();
        const selected = entryIds
            .map(entryId => all.find(o => o.entryId === entryId))
            .filter((o): o is IRefEntryOption => o != null);

        this._resolvedValues = selected;
        return selected.map(opt => ({ id: opt.id, modelId: opt.modelId }));
    }

    clearValue(): void {
        this._resolvedValue = null;
    }

    async resolveValue(value: CmsReferenceValue | null): Promise<void> {
        if (!value) {
            this._resolvedValue = null;
            return;
        }

        this._loading = true;
        try {
            const result = await this.getContentEntriesUseCase.execute({
                entries: [{ id: value.id, modelId: value.modelId }]
            });
            runInAction(() => {
                const entry = result.latest[0];
                this._resolvedValue = entry ? toOption(entry) : null;
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    async resolveValues(values: CmsReferenceValue[]): Promise<void> {
        if (values.length === 0) {
            this._resolvedValues = [];
            return;
        }

        this._loading = true;
        try {
            const result = await this.getContentEntriesUseCase.execute({
                entries: values.map(v => ({ id: v.id, modelId: v.modelId }))
            });
            runInAction(() => {
                this._resolvedValues = result.latest.map(toOption);
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    dispose(): void {
        // Cleanup if needed
    }

    private getAllKnownOptions(): IRefEntryOption[] {
        const seen = new Set<string>();
        const result: IRefEntryOption[] = [];

        const sources = [
            this._resolvedValues,
            this._resolvedValue ? [this._resolvedValue] : [],
            this._searchOptions,
            this._defaultOptions
        ];

        for (const source of sources) {
            for (const opt of source) {
                if (!seen.has(opt.entryId)) {
                    seen.add(opt.entryId);
                    result.push(opt);
                }
            }
        }

        return result;
    }

    private async loadDefaults(): Promise<void> {
        this._loading = true;
        try {
            const result = await this.searchContentEntriesUseCase.execute({
                modelIds: this._modelIds,
                limit: 10
            });
            runInAction(() => {
                this._defaultOptions = result.data.map(toOption);
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }
}

export const RefAutocompletePresenterImplementation = Abstraction.createImplementation({
    implementation: RefAutocompletePresenterImpl,
    dependencies: [SearchContentEntriesUseCase, GetContentEntriesUseCase]
});
