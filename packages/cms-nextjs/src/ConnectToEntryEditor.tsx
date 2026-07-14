"use client";

import React, { useEffect, useState } from "react";
import { contentSdk, type CmsEntry } from "@webiny/cms-sdk";
import { EntryStoreProvider } from "./EntryStoreProvider.js";

interface ConnectToEntryEditorProps {
    modelId: string;
    entryId: string;
    children: React.ReactNode;
}

export const ConnectToEntryEditor = ({ modelId, entryId, children }: ConnectToEntryEditorProps) => {
    const [entry, setEntry] = useState<CmsEntry | null>(null);

    useEffect(() => {
        contentSdk.getEntry({ modelId, entryId }).then(result => {
            if (result) {
                setEntry(result);
            }
        });
    }, [modelId, entryId]);

    if (!entry) {
        return null;
    }

    return (
        <EntryStoreProvider entryId={entryId} entry={entry}>
            {children}
        </EntryStoreProvider>
    );
};
