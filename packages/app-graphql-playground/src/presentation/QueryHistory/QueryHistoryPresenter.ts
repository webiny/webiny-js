import { makeAutoObservable } from "mobx";
import { QueryHistoryRepository } from "../../features/queryHistory/abstractions.js";
import { QueryHistoryPresenter } from "./abstractions.js";
import type { IHistoryEntry } from "../../features/queryHistory/abstractions.js";
import type { IHistoryEntryVm } from "./abstractions.js";

const PREVIEW_MAX_LENGTH = 80;
const PREVIEW_ELLIPSIS = "...";

class QueryHistoryPresenterImpl implements QueryHistoryPresenter.Interface {
    private readonly repository: QueryHistoryRepository.Interface;
    private isOpen = false;
    private search = "";
    private entries: IHistoryEntry[] = [];

    constructor(repository: QueryHistoryRepository.Interface) {
        this.repository = repository;
        makeAutoObservable<QueryHistoryPresenterImpl, "repository">(
            this,
            {
                repository: false
            },
            { autoBind: true }
        );
    }

    public get vm(): QueryHistoryPresenter.Vm {
        return {
            open: this.isOpen,
            searchQuery: this.search,
            entries: this.buildFilteredEntries()
        };
    }

    public toggle(): void {
        this.isOpen = !this.isOpen;
    }

    public setSearchQuery(query: string): void {
        this.search = query;
    }

    public remove(id: string): void {
        this.repository.remove(id);
        this.readFromRepository();
    }

    public clear(): void {
        this.repository.clear();
        this.readFromRepository();
    }

    public load(): void {
        this.readFromRepository();
    }

    public refresh(): void {
        this.readFromRepository();
    }

    private readFromRepository(): void {
        this.entries = this.repository.getAll();
    }

    private buildFilteredEntries(): IHistoryEntryVm[] {
        const lowerSearch = this.search.toLowerCase();

        return this.entries
            .filter(entry => {
                if (this.search === "") {
                    return true;
                }
                return entry.query.toLowerCase().includes(lowerSearch);
            })
            .map(entry => this.toEntryVm(entry));
    }

    private toEntryVm(entry: IHistoryEntry): IHistoryEntryVm {
        const trimmed = entry.query.trim();
        const preview =
            trimmed.length > PREVIEW_MAX_LENGTH
                ? trimmed.slice(0, PREVIEW_MAX_LENGTH - PREVIEW_ELLIPSIS.length) + PREVIEW_ELLIPSIS
                : trimmed;

        return {
            id: entry.id,
            queryPreview: preview,
            endpoint: entry.endpoint,
            definitionId: entry.definitionId,
            timestamp: entry.timestamp,
            query: entry.query,
            variables: entry.variables
        };
    }
}

export const DefaultQueryHistoryPresenter = QueryHistoryPresenter.createImplementation({
    implementation: QueryHistoryPresenterImpl,
    dependencies: [QueryHistoryRepository]
});
