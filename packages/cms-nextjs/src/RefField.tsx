"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { refCache, type CmsEntry, type CmsEntryValues } from "@webiny/cms-sdk";

interface RefValue {
    id: string;
    modelId: string;
}

type RefFieldProps<T extends CmsEntryValues = CmsEntryValues> = {
    value: RefValue | RefValue[] | null | undefined;
    children: (entries: CmsEntry<T>[]) => React.ReactNode;
    loading?: React.ReactNode;
};

function RefFieldInner<T extends CmsEntryValues = CmsEntryValues>({
    value,
    children,
    loading
}: RefFieldProps<T>) {
    const refs = normalizeRefs(value);

    useEffect(() => {
        for (const ref of refs) {
            refCache.resolve(ref.id, ref.modelId);
        }
    }, [refs.map(r => r.id).join(",")]);

    if (refs.length === 0) {
        return null;
    }

    const entries: CmsEntry<T>[] = [];
    let allResolved = true;

    for (const ref of refs) {
        const entry = refCache.get(ref.id);
        if (entry === undefined) {
            allResolved = false;
            break;
        }
        if (entry !== null) {
            entries.push(entry as CmsEntry<T>);
        }
    }

    if (!allResolved) {
        return loading ? <>{loading}</> : null;
    }

    return <>{children(entries)}</>;
}

export const RefField = observer(RefFieldInner) as typeof RefFieldInner;

export namespace RefField {
    export type Value = RefValue | RefValue[] | null | undefined;
}

function normalizeRefs(value: RefValue | RefValue[] | null | undefined): RefValue[] {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.filter(v => v && v.id && v.modelId);
    }
    if (value.id && value.modelId) {
        return [value];
    }
    return [];
}
