"use client";

import React from "react";
import { contentSdk } from "@webiny/cms-sdk";
import type { CmsEntry, CmsModelDefinition, Component } from "@webiny/cms-sdk";
import { EntryStoreProvider } from "./EntryStoreProvider.js";
import { ConnectToEntryEditor } from "./ConnectToEntryEditor.js";

const ComponentsContext = React.createContext<Component[]>([]);
const ModelContext = React.createContext<CmsModelDefinition | null>(null);

export const useComponents = () => React.useContext(ComponentsContext);
export const useModel = () => React.useContext(ModelContext);

interface EntryRendererProps {
    modelId: string;
    entry: CmsEntry | null;
    model: CmsModelDefinition;
    components: Component[];
    children: React.ReactNode;
}

export const EntryRenderer = ({
    modelId,
    entry,
    model,
    components,
    children
}: EntryRendererProps) => {
    if (contentSdk.isEditing()) {
        const entryId = entry ? entry.entryId : getEntryIdFromUrl();
        return (
            <ModelContext.Provider value={model}>
                <ComponentsContext.Provider value={components}>
                    <ConnectToEntryEditor modelId={modelId} entryId={entryId}>
                        {children}
                    </ConnectToEntryEditor>
                </ComponentsContext.Provider>
            </ModelContext.Provider>
        );
    }

    if (!entry) {
        return null;
    }

    return (
        <ModelContext.Provider value={model}>
            <ComponentsContext.Provider value={components}>
                <EntryStoreProvider entryId={entry.entryId} entry={entry}>
                    {children}
                </EntryStoreProvider>
            </ComponentsContext.Provider>
        </ModelContext.Provider>
    );
};

function getEntryIdFromUrl(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get("wb.id") || "";
}
