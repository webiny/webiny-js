import { useCallback, useEffect } from "react";

type Listener = (newValue: string | null, oldValue: string | null) => void;

const listeners: Record<string, Set<Listener>> = {};

function subscribe(key: string, listener: Listener): () => void {
    if (!listeners[key]) {
        listeners[key] = new Set();
    }
    listeners[key].add(listener);

    const handler = (e: StorageEvent) => {
        if (e.key === key) {
            listeners[key]?.forEach(fn => fn(e.newValue, e.oldValue));
        }
    };

    const handleCustomEvent = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail.key === key) {
            listeners[key]?.forEach(fn => fn(detail.value, localStorage.getItem(key)));
        }
    };

    window.addEventListener("storage", handler);
    window.addEventListener("local-storage-change", handleCustomEvent);

    return () => {
        listeners[key]?.delete(listener);
        if (listeners[key]?.size === 0) {
            window.removeEventListener("storage", handler);
            window.removeEventListener("local-storage-change", handleCustomEvent);
            delete listeners[key];
        }
    };
}

/**
 * React hook to subscribe to localStorage changes on a specific key.
 * Fires on cross-tab change only (native behavior), but also supports same-tab updates via custom event.
 */
export function useSubscribeToLocalStorage(
    key: string,
    listener: Listener
): {
    set: (value: string) => void;
    unset: () => void;
} {
    useEffect(() => {
        return subscribe(key, listener);
    }, [key, listener]);

    const set = useCallback((value: string) => {
        localStorage.setItem(key, value);
        window.dispatchEvent(
            new CustomEvent("local-storage-change", {
                detail: { key, value }
            })
        );
    }, []);

    const unset = useCallback(() => {
        localStorage.removeItem(key);
        window.dispatchEvent(
            new CustomEvent("local-storage-change", {
                detail: { key, value: null }
            })
        );
    }, []);

    return { set, unset };
}
