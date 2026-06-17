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
    private _options: IRefEntryOption[] = [];
    private _defaultOptions: IRefEntryOption[] = [];
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
        const options = this._searchQuery ? this._options : this._defaultOptions;
        return {
            loading: this._loading,
            options,
            resolvedValue: this._resolvedValue,
            resolvedValues: this._resolvedValues
        };
    }

    async init(config: IRefAutocompletePresenterInitConfig): Promise<void> {
        this._modelIds = config.modelIds;
        await this.loadDefaults();
    }

    async search(query: string): Promise<void> {
        this._searchQuery = query;

        if (!query) {
            this._options = [];
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
                this._options = result.data.map(toOption);
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
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
