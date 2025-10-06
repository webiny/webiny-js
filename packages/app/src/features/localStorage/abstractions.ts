import { Abstraction } from "@webiny/di-container";

/** Gateway: raw IO into localStorage (or other storage). */
export interface ILocalStorageGateway {
    get<T = string>(key: string): T | null;
    set<T = string>(key: string, value: T): void;
    remove(key: string): void;
    clear(): void;
    getAll(): Record<string, unknown>;
    subscribe(listener: (event: StorageEvent | CustomEvent) => void): () => void;
}

export const LocalStorageGateway = new Abstraction<ILocalStorageGateway>("LocalStorageGateway");

export namespace LocalStorageGateway {
    export type Interface = ILocalStorageGateway;
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

export const LocalStorageRepository = new Abstraction<ILocalStorageRepository>(
    "LocalStorageRepository"
);

export namespace LocalStorageRepository {
    export type Interface = ILocalStorageRepository;
}

/** Config: configure key prefixes, etc. */
export interface ILocalStorageConfig {
    prefix?: string;
}

export const LocalStorageConfig = new Abstraction<ILocalStorageConfig>("LocalStorageConfig");

export namespace LocalStorageConfig {
    export type Interface = ILocalStorageConfig;
}

/** Service: thin façade, delegates to repository for consumers. */
export interface ILocalStorageService {
    get<T = string>(key: string): T | undefined;
    set<T = string>(key: string, value: T): void;
    remove(key: string): void;
    clear(): void;
    keys(): string[];
}

export const LocalStorageService = new Abstraction<ILocalStorageService>("LocalStorageService");

export namespace LocalStorageService {
    export type Interface = ILocalStorageService;
}
