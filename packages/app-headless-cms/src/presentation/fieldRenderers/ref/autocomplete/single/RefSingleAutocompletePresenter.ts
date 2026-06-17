import { computed, makeAutoObservable, runInAction } from "mobx";
import { SearchContentEntriesUseCase } from "~/features/contentEntry/searchContentEntries/abstractions.js";
import { GetContentEntriesUseCase } from "~/features/contentEntry/getContentEntries/abstractions.js";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { IRefEntryOption, IDropdownOption } from "../abstractions.js";
import { BaseAutocompletePresenter } from "../BaseAutocompletePresenter.js";
import {
    RefSingleAutocompletePresenter as Abstraction,
    type IRefSingleAutocompleteInitConfig,
    type IRefSingleAutocompleteViewModel
} from "./abstractions.js";

class RefSingleAutocompletePresenterImpl implements Abstraction.Interface {
    private base: BaseAutocompletePresenter;
    private _resolved: IRefEntryOption | null = null;

    constructor(
        searchUseCase: SearchContentEntriesUseCase.Interface,
        getEntriesUseCase: GetContentEntriesUseCase.Interface
    ) {
        this.base = new BaseAutocompletePresenter(searchUseCase, getEntriesUseCase);
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): IRefSingleAutocompleteViewModel {
        const baseOptions = this.base.activeOptions;

        const seen = new Set<string>();
        const merged: IDropdownOption[] = [];

        if (this._resolved) {
            seen.add(this._resolved.entryId);
            merged.push({ label: this._resolved.name, value: this._resolved.entryId });
        }

        for (const opt of baseOptions) {
            if (!seen.has(opt.entryId)) {
                seen.add(opt.entryId);
                merged.push({ label: opt.name, value: opt.entryId });
            }
        }

        return {
            loading: this.base.loading,
            options: merged,
            value: this._resolved ? this._resolved.entryId : undefined,
            canReset: this._resolved !== null
        };
    }

    async init(config: IRefSingleAutocompleteInitConfig): Promise<void> {
        this.base.modelIds = config.modelIds;
        await this.base.loadDefaults();

        if (config.value) {
            await this.resolve(config.value);
        }
    }

    async search(query: string): Promise<void> {
        await this.base.search(query);
    }

    select(entryId: string): CmsReferenceValue | null {
        this.base.clearSearch();

        const opt = this.findOption(entryId);
        if (!opt) {
            return null;
        }
        this._resolved = opt;
        return { id: opt.id, modelId: opt.modelId };
    }

    clear(): void {
        this.base.clearSearch();
        this._resolved = null;
    }

    dispose(): void {}

    private async resolve(value: CmsReferenceValue): Promise<void> {
        const options = await this.base.resolveEntries([value]);
        runInAction(() => {
            this._resolved = options[0] ?? null;
        });
    }

    private findOption(entryId: string): IRefEntryOption | undefined {
        const sources = [
            this._resolved ? [this._resolved] : [],
            this.base.searchOptions,
            this.base.defaultOptions
        ];
        for (const source of sources) {
            const found = source.find(o => o.entryId === entryId);
            if (found) {
                return found;
            }
        }
        return undefined;
    }
}

export const RefSingleAutocompletePresenter = Abstraction.createImplementation({
    implementation: RefSingleAutocompletePresenterImpl,
    dependencies: [SearchContentEntriesUseCase, GetContentEntriesUseCase]
});
