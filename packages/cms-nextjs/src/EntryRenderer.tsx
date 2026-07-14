"use client";

import React from "react";
import { contentSdk } from "@webiny/cms-sdk";
import type { CmsEntry, Component } from "@webiny/cms-sdk";
import { EntryStoreProvider } from "./EntryStoreProvider.js";
import { ConnectToEntryEditor } from "./ConnectToEntryEditor.js";

const ComponentsContext = React.createContext<Component[]>([]);

export const useComponents = () => React.useContext(ComponentsContext);

interface EntryRendererProps {
    modelId: string;
    entry: CmsEntry | null;
    components: Component[];
    children: React.ReactNode;
}

export const EntryRenderer = ({ modelId, entry, components, children }: EntryRendererProps) => {
    if (contentSdk.isEditing()) {
        const entryId = entry ? entry.entryId : getEntryIdFromUrl();
        return (
            <ComponentsContext.Provider value={components}>
                <ConnectToEntryEditor modelId={modelId} entryId={entryId}>
                    {children}
                </ConnectToEntryEditor>
            </ComponentsContext.Provider>
        );
    }

    if (!entry) {
        return null;
    }

    return (
        <ComponentsContext.Provider value={components}>
            <EntryStoreProvider entryId={entry.entryId} entry={entry}>
                {children}
            </EntryStoreProvider>
        </ComponentsContext.Provider>
    );
};

function getEntryIdFromUrl(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get("wb.id") || "";
}
