import { computed, makeAutoObservable, runInAction } from "mobx";
import { SearchContentEntriesUseCase } from "~/features/contentEntry/searchContentEntries/abstractions.js";
import {
    RefSimplePresenter as Abstraction,
    type IRefSimplePresenterInitConfig,
    type IRefSimpleViewModel,
    type IRefSimpleEntry
} from "./abstractions.js";

class RefSimplePresenterImpl implements Abstraction.Interface {
    private _loading = false;
    private _entries: IRefSimpleEntry[] = [];

    constructor(private searchContentEntriesUseCase: SearchContentEntriesUseCase.Interface) {
        makeAutoObservable<RefSimplePresenterImpl, "searchContentEntriesUseCase">(this, {
            searchContentEntriesUseCase: false,
            vm: computed
        });
    }

    get vm(): IRefSimpleViewModel {
        return {
            loading: this._loading,
            entries: this._entries
        };
    }

    async init(config: IRefSimplePresenterInitConfig): Promise<void> {
        this._loading = true;
        try {
            const result = await this.searchContentEntriesUseCase.execute({
                modelIds: config.modelIds
            });

            runInAction(() => {
                this._entries = result.data.map(entry => ({
                    id: entry.id,
                    entryId: entry.entryId,
                    title: entry.title,
                    modelId: entry.model.modelId
                }));
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
}

export const RefSimplePresenterImplementation = Abstraction.createImplementation({
    implementation: RefSimplePresenterImpl,
    dependencies: [SearchContentEntriesUseCase]
});
