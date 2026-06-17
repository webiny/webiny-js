import { computed, makeAutoObservable, runInAction } from "mobx";
import { GetContentEntriesUseCase } from "~/features/contentEntry/getContentEntries/abstractions.js";
import { ListModelsUseCase } from "~/features/model/listModels/abstractions.js";
import type { CmsModel } from "~/types.js";
import type { CmsReferenceEntry, CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import {
    RefDetailedPresenter as Abstraction,
    type IRefDetailedPresenterInitConfig,
    type IRefDetailedViewModel
} from "./abstractions.js";

const PER_PAGE = 10;

class RefDetailedPresenterImpl implements Abstraction.Interface {
    private _loading = false;
    private _entries: CmsReferenceEntry[] = [];
    private _models: CmsModel[] = [];
    private _multiSelect = false;
    private _currentPage = 0;
    private _allValues: CmsReferenceValue[] = [];

    constructor(
        private getContentEntriesUseCase: GetContentEntriesUseCase.Interface,
        private listModelsUseCase: ListModelsUseCase.Interface
    ) {
        makeAutoObservable<
            RefDetailedPresenterImpl,
            "getContentEntriesUseCase" | "listModelsUseCase"
        >(this, {
            getContentEntriesUseCase: false,
            listModelsUseCase: false,
            vm: computed
        });
    }

    get vm(): IRefDetailedViewModel {
        return {
            loading: this._loading,
            entries: this._entries,
            models: this._models,
            multiSelect: this._multiSelect
        };
    }

    async init(config: IRefDetailedPresenterInitConfig): Promise<void> {
        this._multiSelect = config.multiSelect;

        const allModels = await this.listModelsUseCase.execute();
        runInAction(() => {
            this._models = allModels.filter(m => config.modelIds.includes(m.modelId));
        });
    }

    async resolveValues(values: CmsReferenceValue[]): Promise<void> {
        this._allValues = values;
        this._currentPage = 0;
        this._entries = [];

        if (values.length === 0) {
            return;
        }

        await this.loadPage(0);
    }

    loadMore(): void {
        const nextPage = this._currentPage + 1;
        const start = nextPage * PER_PAGE;
        if (start >= this._allValues.length) {
            return;
        }
        this.loadPage(nextPage);
    }

    dispose(): void {
        // Cleanup if needed
    }

    private async loadPage(page: number): Promise<void> {
        const start = page * PER_PAGE;
        const chunk = this._allValues.slice(start, start + PER_PAGE);

        if (chunk.length === 0) {
            return;
        }

        this._loading = true;

        try {
            const result = await this.getContentEntriesUseCase.execute({
                entries: chunk.map(v => ({ id: v.id, modelId: v.modelId }))
            });

            runInAction(() => {
                this._currentPage = page;

                const entryMap = new Map<string, CmsReferenceEntry>();
                for (const entry of result.latest) {
                    entryMap.set(entry.entryId, entry);
                }

                for (const entry of result.published) {
                    const existing = entryMap.get(entry.entryId);
                    if (existing) {
                        existing.published = {
                            id: entry.id,
                            entryId: entry.entryId,
                            title: entry.title
                        };
                    }
                }

                const resolved = chunk
                    .map(v => {
                        const entryId = v.id.split("#")[0];
                        return entryMap.get(entryId);
                    })
                    .filter((e): e is CmsReferenceEntry => e != null);

                if (page === 0) {
                    this._entries = resolved;
                } else {
                    this._entries = [...this._entries, ...resolved];
                }
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }
}

export const RefDetailedPresenterImplementation = Abstraction.createImplementation({
    implementation: RefDetailedPresenterImpl,
    dependencies: [GetContentEntriesUseCase, ListModelsUseCase]
});
