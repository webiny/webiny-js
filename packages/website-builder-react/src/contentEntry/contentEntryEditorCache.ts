import { makeAutoObservable, runInAction } from "mobx";
import {
    resolveContentEntryInput,
    type ContentEntryInput,
    type ContentEntryReference,
    type ContentEntryQueryValue,
    type ContentEntryLoader,
    type ResolvedContentEntry
} from "@webiny/website-builder-sdk";
import { contentSdk } from "@webiny/cms-sdk";

type RawValue =
    | ContentEntryReference
    | ContentEntryReference[]
    | ContentEntryQueryValue
    | null
    | undefined;

const loader: ContentEntryLoader = {
    getEntry: params => contentSdk.getEntry(params),
    listEntries: params => contentSdk.listEntries(params)
};

// Non-observable dedupe set (kept out of the observable class so touching it
// during render never counts as a mobx mutation-in-render).
const pending = new Set<string>();

/**
 * Reactive, client-side cache for resolving `contentEntry` inputs in the editor
 * preview — mirrors the CMS `refCache`. Keyed by a signature of the raw value,
 * so when the editor changes the selection/query the key changes and the entry
 * is re-resolved. The async result is written inside a mobx action, so `observer`
 * components re-render once it lands. No `useEffect` needed for the data itself.
 */
class ContentEntryEditorCacheImpl {
    private cache = new Map<string, ResolvedContentEntry>();

    constructor() {
        makeAutoObservable(this);
    }

    get(key: string): ResolvedContentEntry | undefined {
        return this.cache.get(key);
    }

    has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Lazily resolve `value` for `input` under `key`. Idempotent and safe to call
     * during render: the observable write happens later, inside an action.
     */
    resolve(key: string, input: ContentEntryInput, value: RawValue): void {
        if (this.cache.has(key) || pending.has(key)) {
            return;
        }
        pending.add(key);
        resolveContentEntryInput(input, value, loader)
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
}

export const contentEntryEditorCache = new ContentEntryEditorCacheImpl();
