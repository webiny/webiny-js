import { computed, makeAutoObservable, runInAction } from "mobx";
import { SearchContentEntriesUseCase } from "~/features/contentEntry/searchContentEntries/abstractions.js";
import {
    RefSimplePresenter as Abstraction,
    type IRefSimplePresenterInitConfig,
    type IRefSimpleViewModel,
    type IRefSimpleEntry
} from "./abstractions.js";

class RefSimplePresenterImpl implements Abstraction.Interface {
    private loading = false;
    private entries: IRefSimpleEntry[] = [];

    constructor(private searchContentEntriesUseCase: SearchContentEntriesUseCase.Interface) {
        makeAutoObservable<RefSimplePresenterImpl, "searchContentEntriesUseCase">(this, {
            searchContentEntriesUseCase: false,
            vm: computed
        });
    }

    get vm(): IRefSimpleViewModel {
        return {
            loading: this.loading,
            entries: this.entries
        };
    }

    async init(config: IRefSimplePresenterInitConfig): Promise<void> {
        this.loading = true;
        try {
            const result = await this.searchContentEntriesUseCase.execute({
                modelIds: config.modelIds
            });

            runInAction(() => {
                this.entries = result.data.map(entry => ({
                    id: entry.id,
                    entryId: entry.entryId,
                    title: entry.title,
                    modelId: entry.model.modelId
                }));
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    dispose(): void {
        // Cleanup if needed
    }
}

export const RefSimplePresenter = Abstraction.createImplementation({
    implementation: RefSimplePresenterImpl,
    dependencies: [SearchContentEntriesUseCase]
});
