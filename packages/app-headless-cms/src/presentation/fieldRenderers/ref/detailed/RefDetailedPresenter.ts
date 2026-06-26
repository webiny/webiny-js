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
    private loading = false;
    private entries: CmsReferenceEntry[] = [];
    private models: CmsModel[] = [];
    private multiSelect = false;
    private currentPage = 0;
    private allValues: CmsReferenceValue[] = [];

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
            loading: this.loading,
            entries: this.entries,
            models: this.models,
            multiSelect: this.multiSelect
        };
    }

    async init(config: IRefDetailedPresenterInitConfig): Promise<void> {
        this.multiSelect = config.multiSelect;

        const allModels = await this.listModelsUseCase.execute();
        runInAction(() => {
            this.models = allModels.filter(m => config.modelIds.includes(m.modelId));
        });
    }

    async resolveValues(values: CmsReferenceValue[]): Promise<void> {
        this.allValues = values;
        this.currentPage = 0;

        if (values.length === 0) {
            this.entries = [];
            return;
        }

        await this.loadPage(0);
    }

    addEntries(entries: CmsReferenceEntry[]): void {
        const existingIds = new Set(this.entries.map(e => e.entryId));
        const newEntries = entries.filter(e => !existingIds.has(e.entryId));
        this.entries = [...this.entries, ...newEntries];
    }

    removeEntry(entryId: string): void {
        this.entries = this.entries.filter(e => e.entryId !== entryId);
    }

    loadMore(): void {
        const nextPage = this.currentPage + 1;
        const start = nextPage * PER_PAGE;
        if (start >= this.allValues.length) {
            return;
        }
        this.loadPage(nextPage);
    }

    dispose(): void {
        // Cleanup if needed
    }

    private async loadPage(page: number): Promise<void> {
        const start = page * PER_PAGE;
        const chunk = this.allValues.slice(start, start + PER_PAGE);

        if (chunk.length === 0) {
            return;
        }

        this.loading = true;

        try {
            const result = await this.getContentEntriesUseCase.execute({
                entries: chunk.map(v => ({ id: v.id, modelId: v.modelId }))
            });

            runInAction(() => {
                this.currentPage = page;

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
                    this.entries = resolved;
                } else {
                    this.entries = [...this.entries, ...resolved];
                }
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }
}

export const RefDetailedPresenter = Abstraction.createImplementation({
    implementation: RefDetailedPresenterImpl,
    dependencies: [GetContentEntriesUseCase, ListModelsUseCase]
});
