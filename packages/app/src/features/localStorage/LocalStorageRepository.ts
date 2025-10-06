import { makeAutoObservable, runInAction } from "mobx";
import {
    LocalStorageRepository as LocalStorageRepositoryAbstraction,
    LocalStorageConfig,
    LocalStorageGateway
} from "./abstractions.js";
import { createImplementation } from "@webiny/di-container";

export class LocalStorageRepositoryImpl implements LocalStorageRepositoryAbstraction.Interface {
    private readonly prefix: string;
    private store = new Map<string, unknown>();
    private unsubscribe?: () => void;

    constructor(
        private gateway: LocalStorageGateway.Interface,
        config: LocalStorageConfig.Interface
    ) {
        this.prefix = config.prefix || "";
        makeAutoObservable(this);

        this.bootstrap();
        this.subscribeToChanges();
    }

    private withPrefix(key: string): string {
        return this.prefix ? `${this.prefix}:${key}` : key;
    }

    private stripPrefix(key: string): string {
        return this.prefix ? key.replace(new RegExp(`^${this.prefix}:`), "") : key;
    }

    private bootstrap() {
        const all = this.gateway.getAll();
        for (const [key, value] of Object.entries(all)) {
            if (!this.prefix || key.startsWith(this.prefix + ":")) {
                this.store.set(this.stripPrefix(key), value);
            }
        }
    }

    private subscribeToChanges() {
        this.unsubscribe = this.gateway.subscribe(ev => {
            runInAction(() => {
                if (ev instanceof StorageEvent && ev.key) {
                    if (!this.prefix || ev.key.startsWith(this.prefix + ":")) {
                        const cleanKey = this.stripPrefix(ev.key);
                        if (ev.newValue !== null) {
                            try {
                                this.store.set(cleanKey, JSON.parse(ev.newValue));
                            } catch {
                                this.store.set(cleanKey, ev.newValue);
                            }
                        } else {
                            this.store.delete(cleanKey);
                        }
                    }
                }
                if (ev instanceof CustomEvent) {
                    const { key, value, action } = ev.detail;
                    if (!this.prefix || key.startsWith(this.prefix + ":")) {
                        const cleanKey = this.stripPrefix(key);
                        if (action === "set") {
                            this.store.set(cleanKey, value);
                        }
                        if (action === "remove") {
                            this.store.delete(cleanKey);
                        }
                        if (action === "clear") {
                            this.store.clear();
                        }
                    }
                }
            });
        });
    }

    destroy() {
        this.unsubscribe?.();
    }

    has(key: string) {
        return this.store.has(key);
    }
    get<T = string>(key: string) {
        return this.store.get(key) as T | undefined;
    }
    set<T = string>(key: string, value: T) {
        this.gateway.set(this.withPrefix(key), value);
    }
    remove(key: string) {
        this.gateway.remove(this.withPrefix(key));
    }
    clear() {
        this.gateway.clear();
        this.store.clear();
    }
    keys(): string[] {
        return Array.from(this.store.keys());
    }
}

export const LocalStorageRepository = createImplementation({
    abstraction: LocalStorageRepositoryAbstraction,
    implementation: LocalStorageRepositoryImpl,
    dependencies: [LocalStorageGateway, LocalStorageConfig]
});
