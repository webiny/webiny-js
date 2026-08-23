import { makeAutoObservable, runInAction } from "mobx";
import type { ContentEntryInput } from "~/types.js";
import { resolveContentEntryInput, type ContentEntryLoader, type ResolvedContentEntry } from "./resolveContentEntry.js";

type RawValue = unknown | unknown[] | null | undefined;

// Non-observable dedupe set (kept out of the observable class so touching it
// during render never counts as a mobx mutation-in-render).
const pending = new Set<string>();

/**
 * SDK-level mobx cache for resolved content-entry inputs. Mirrors the CMS
 * `RefCache` pattern: a singleton observable store that both the server
 * pre-pass (`resolveAutoLoad`) and the editor preview path can seed / read.
 *
 * - **Server / SSR**: `resolveAutoLoad` calls `set(key, resolved)` for every
 *   entry it pre-resolves. `BindingsResolver.resolveSingleInstance` reads via
 *   `get(key)` synchronously during render — no React context needed.
 *
 * - **Editor preview**: `resolve(key, input, value, loader)` triggers an async
 *   fetch whose result is written inside a mobx action, so `observer`
 *   components re-render once it lands. Keyed by a signature of the raw value,
 *   so when the editor changes the selection/query the key changes and the
 *   entry is re-resolved.
 */
class ContentEntryCacheImpl {
    private cache = new Map<string, ResolvedContentEntry>();
    private loader: ContentEntryLoader | undefined;

    constructor() {
        makeAutoObservable(this, {
            // The loader is a plain service reference, not an observable value.
            setLoader: false,
            getLoader: false
        });
    }

    get(key: string): ResolvedContentEntry | undefined {
        return this.cache.get(key);
    }

    has(key: string): boolean {
        return this.cache.has(key);
    }

    set(key: string, value: ResolvedContentEntry): void {
        runInAction(() => {
            this.cache.set(key, value);
        });
    }

    /**
     * Register the CMS data loader that `resolve()` will use for async fetches.
     * Called once during initialisation (e.g. by `resolveAutoLoad`). The loader
     * is **not** mobx-observable — it's a plain service reference.
     */
    setLoader(loader: ContentEntryLoader): void {
        this.loader = loader;
    }

    /**
     * Return the registered loader, if any.
     */
    getLoader(): ContentEntryLoader | undefined {
        return this.loader;
    }

    /**
     * Lazily resolve `value` for `input` under `key`. Idempotent and safe to
     * call during render: the observable write happens later, inside an action.
     *
     * Uses the loader registered via `setLoader()`. If no loader is registered,
     * the call is a no-op (the raw value will be used instead).
     */
    resolve(key: string, input: ContentEntryInput, value: RawValue): void {
        if (this.cache.has(key) || pending.has(key) || !this.loader) {
            return;
        }
        pending.add(key);
        resolveContentEntryInput(input, value as any, this.loader)
            .then(resolved => {
                runInAction(() => {
                    this.cache.set(key, resolved);
                });
                pending.delete(key);
            })
            .catch(() => {
                pending.delete(key);
            });
    }

    clear(): void {
        runInAction(() => {
            this.cache.clear();
        });
    }
}

export const contentEntryCache = new ContentEntryCacheImpl();
