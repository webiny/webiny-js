/** Gateway: raw IO into localStorage (or other storage). */
export interface ILocalStorageGateway {
    get<T = string>(key: string): T | null;
    set<T = string>(key: string, value: T): void;
    remove(key: string): void;
    clear(): void;
    getAll(): Record<string, unknown>;
    subscribe(listener: (event: StorageEvent | CustomEvent) => void): () => void;
}

/** Repository: reactive state (MobX), synchronized with gateway. */
export interface ILocalStorageRepository {
    has(key: string): boolean;
    get<T = string>(key: string): T | undefined;
    set<T = string>(key: string, value: T): void;
    remove(key: string): void;
    clear(): void;
    keys(): string[];
    destroy(): void;
}

/** Service: thin façade, delegates to repository for consumers. */
export interface ILocalStorage {
    get<T = string>(key: string): T | undefined;
    set<T = string>(key: string, value: T): void;
    remove(key: string): void;
    clear(): void;
    keys(): string[];
}

/** Config: configure key prefixes, etc. */
export interface ILocalStorageConfig {
    prefix?: string;
}
