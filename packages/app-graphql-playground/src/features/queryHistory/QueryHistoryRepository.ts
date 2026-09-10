import { uuid } from "@webiny/stdlib";
import { LocalStorage } from "@webiny/app/features/localStorage/abstractions.js";
import { QueryHistoryRepository } from "./abstractions.js";
import type { IHistoryEntry } from "./abstractions.js";

const STORAGE_KEY = "graphql-playground-history";
const MAX_ENTRIES = 100;

interface IDedupKeyInput {
    query: string;
    variables: string;
    endpoint: string;
}

class QueryHistoryRepositoryImpl implements QueryHistoryRepository.Interface {
    private readonly localStorage: LocalStorage.Interface;

    constructor(localStorage: LocalStorage.Interface) {
        this.localStorage = localStorage;
    }

    public record(entry: Omit<IHistoryEntry, "id" | "timestamp">): void {
        const entries = this.readEntries();
        const dedupKey = this.buildDedupKey(entry);

        const existingIndex = entries.findIndex(e => this.buildDedupKey(e) === dedupKey);

        if (existingIndex !== -1) {
            entries.splice(existingIndex, 1);
        }

        entries.unshift({
            ...entry,
            id: uuid(),
            timestamp: Date.now()
        });

        if (entries.length > MAX_ENTRIES) {
            entries.length = MAX_ENTRIES;
        }

        this.writeEntries(entries);
    }

    public remove(id: string): void {
        const entries = this.readEntries();
        const filtered = entries.filter(e => e.id !== id);
        this.writeEntries(filtered);
    }

    public clear(): void {
        this.writeEntries([]);
    }

    public getAll(): IHistoryEntry[] {
        return this.readEntries();
    }

    private readEntries(): IHistoryEntry[] {
        try {
            const data = this.localStorage.get<IHistoryEntry[]>(STORAGE_KEY);
            if (!data || !Array.isArray(data)) {
                return [];
            }
            return data;
        } catch {
            /* Corrupt or unreadable history must never break the playground. */
            return [];
        }
    }

    private writeEntries(entries: IHistoryEntry[]): void {
        this.localStorage.set(STORAGE_KEY, entries);
    }

    private buildDedupKey(entry: IDedupKeyInput): string {
        return `${entry.query}\0${entry.variables}\0${entry.endpoint}`;
    }
}

export const DefaultQueryHistoryRepository = QueryHistoryRepository.createImplementation({
    implementation: QueryHistoryRepositoryImpl,
    dependencies: [LocalStorage]
});
