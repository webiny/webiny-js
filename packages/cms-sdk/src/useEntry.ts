"use client";

import { useState, useEffect } from "react";
import type { CmsEntryValues, CmsEntry } from "./types.js";
import { contentSdk } from "./ContentSdk.js";
import { environment } from "./Environment.js";

export interface UseEntryParams {
    modelId: string;
    entryId: string;
}

export interface UseEntryResult<T extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<T> | null;
    loading: boolean;
}

export function useEntry<T extends CmsEntryValues = CmsEntryValues>(
    params: UseEntryParams
): UseEntryResult<T> {
    const [entry, setEntry] = useState<CmsEntry<T> | null>(null);
    const [loading, setLoading] = useState(!environment.isEditing());

    useEffect(() => {
        if (environment.isEditing()) {
            const unsubscribe = contentSdk.onEntryUpdate(data => {
                setEntry(data as unknown as CmsEntry<T>);
            });
            return unsubscribe;
        }

        let cancelled = false;
        setLoading(true);

        contentSdk
            .getEntry<T>({ modelId: params.modelId, entryId: params.entryId })
            .then(result => {
                if (!cancelled) {
                    setEntry(result);
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [params.modelId, params.entryId]);

    return { entry, loading };
}
