import { makeAutoObservable, runInAction } from "mobx";
import { EntryDTO, EntryRepository } from "./domain";

interface EntryOption {
    id: string;
    name: string;
}

export interface RefPresenterViewModel {
    selected?: EntryOption;
    options: EntryOption[];
    loading: boolean;
}

interface IRefPresenter {
    load(id?: string): Promise<void>;
    search(query: string): Promise<void>;
    get vm(): RefPresenterViewModel;
}

export class RefPresenter implements IRefPresenter {
    private repository: EntryRepository;
    private currentEntry: EntryDTO | null = null;

    constructor(repository: EntryRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async load(id?: string) {
        if (!id) {
            return;
        }
        const entry = await this.repository.getEntryById(id);

        if (!entry) {
            return;
        }

        runInAction(() => {
            this.currentEntry = entry;
        });
    }

    async search(query: string) {
        await this.repository.listEntries(query);
    }

    get vm() {
        return {
            selected: this.currentEntry
                ? {
                      id: this.currentEntry.entryId,
                      name: this.currentEntry.title
                  }
                : undefined,
            loading: this.repository.getLoading().isLoading,
            options: this.repository.getEntries().map(entry => ({
                id: entry.entryId,
                name: entry.title
            }))
        };
    }
}
