import { ILocalStorageGateway } from "./abstractions.js";

export class BrowserLocalStorageGateway implements ILocalStorageGateway {
    get<T = string>(key: string): T | null {
        const value = window.localStorage.getItem(key);
        try {
            return value ? (JSON.parse(value) as T) : null;
        } catch {
            return value as unknown as T;
        }
    }

    set<T = string>(key: string, value: T): void {
        const serialized = typeof value === "string" ? value : JSON.stringify(value);
        window.localStorage.setItem(key, serialized);

        // Dispatch local event so same-tab listeners are notified.
        window.dispatchEvent(
            new CustomEvent("localstorage:changed", {
                detail: { key, value, action: "set" }
            })
        );
    }

    remove(key: string): void {
        window.localStorage.removeItem(key);
        window.dispatchEvent(
            new CustomEvent("localstorage:changed", {
                detail: { key, action: "remove" }
            })
        );
    }

    clear(): void {
        window.localStorage.clear();
        window.dispatchEvent(
            new CustomEvent("localstorage:changed", {
                detail: { action: "clear" }
            })
        );
    }

    getAll(): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i)!;
            const val = this.get(key);
            if (val !== null) {
                result[key] = val;
            }
        }
        return result;
    }

    // Subscribe to changes (cross-tab + same-tab)
    subscribe(listener: (event: StorageEvent | CustomEvent) => void): () => void {
        const handler = (ev: Event) => {
            if (ev instanceof StorageEvent || ev instanceof CustomEvent) {
                listener(ev);
            }
        };
        window.addEventListener("storage", handler);
        window.addEventListener("localstorage:changed", handler as any);

        return () => {
            window.removeEventListener("storage", handler);
            window.removeEventListener("localstorage:changed", handler as any);
        };
    }
}
