import { computed, makeAutoObservable, runInAction } from "mobx";
import { SearchContentEntriesUseCase } from "~/features/contentEntry/searchContentEntries/abstractions.js";
import { GetContentEntriesUseCase } from "~/features/contentEntry/getContentEntries/abstractions.js";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { IRefEntryOption, IDropdownOption } from "../abstractions.js";
import { BaseAutocompletePresenter } from "../BaseAutocompletePresenter.js";
import {
    RefMultiAutocompletePresenter as Abstraction,
    type IRefMultiAutocompleteInitConfig,
    type IRefMultiAutocompleteViewModel
} from "./abstractions.js";

class RefMultiAutocompletePresenterImpl implements Abstraction.Interface {
    private base: BaseAutocompletePresenter;
    private _resolved: IRefEntryOption[] = [];

    constructor(
        searchUseCase: SearchContentEntriesUseCase.Interface,
        getEntriesUseCase: GetContentEntriesUseCase.Interface
    ) {
        this.base = new BaseAutocompletePresenter(searchUseCase, getEntriesUseCase);
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): IRefMultiAutocompleteViewModel {
        const baseOptions = this.base.activeOptions;

        const seen = new Set<string>();
        const merged: IDropdownOption[] = [];

        for (const opt of this._resolved) {
            if (!seen.has(opt.entryId)) {
                seen.add(opt.entryId);
                merged.push({ label: opt.name, value: opt.entryId });
            }
        }

        for (const opt of baseOptions) {
            if (!seen.has(opt.entryId)) {
                seen.add(opt.entryId);
                merged.push({ label: opt.name, value: opt.entryId });
            }
        }

        const values = this._resolved.map(v => v.entryId);
        const ready = this._resolved.length > 0;

        return {
            loading: this.base.loading,
            options: merged,
            values: ready ? values : [],
            ready
        };
    }

    async init(config: IRefMultiAutocompleteInitConfig): Promise<void> {
        this.base.modelIds = config.modelIds;
        await this.base.loadDefaults();

        if (config.values && config.values.length > 0) {
            await this.resolve(config.values);
        }
    }

    async search(query: string): Promise<void> {
        await this.base.search(query);
    }

    select(entryIds: string[]): CmsReferenceValue[] {
        this.base.clearSearch();

        const allOptions = this.getAllKnownOptions();
        const selected = entryIds
            .map(entryId => allOptions.find(o => o.entryId === entryId))
            .filter((o): o is IRefEntryOption => o != null);

        this._resolved = selected;
        return selected.map(opt => ({ id: opt.id, modelId: opt.modelId }));
    }

    clear(): void {
        this.base.clearSearch();
        this._resolved = [];
    }

    dispose(): void {}

    private async resolve(values: CmsReferenceValue[]): Promise<void> {
        const options = await this.base.resolveEntries(values);
        runInAction(() => {
            this._resolved = options;
        });
    }

    private getAllKnownOptions(): IRefEntryOption[] {
        const seen = new Set<string>();
        const result: IRefEntryOption[] = [];

        for (const source of [this._resolved, this.base.searchOptions, this.base.defaultOptions]) {
            for (const opt of source) {
                if (!seen.has(opt.entryId)) {
                    seen.add(opt.entryId);
                    result.push(opt);
                }
            }
        }

        return result;
    }
}

export const RefMultiAutocompletePresenter = Abstraction.createImplementation({
    implementation: RefMultiAutocompletePresenterImpl,
    dependencies: [SearchContentEntriesUseCase, GetContentEntriesUseCase]
});
