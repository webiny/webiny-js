"use client";

import React, { useMemo } from "react";
import { contentSdk, componentRegistry, refCache } from "@webiny/cms-sdk";
import type { CmsEntry, CmsModelDefinition, Component, EntryStoreConfig } from "@webiny/cms-sdk";
import { EntryStoreProvider } from "./EntryStoreProvider.js";
import { ConnectToEntryEditor } from "./ConnectToEntryEditor.js";

const ComponentsContext = React.createContext<Component[]>([]);
const ModelContext = React.createContext<CmsModelDefinition | null>(null);

export const useComponents = () => React.useContext(ComponentsContext);
export const useModel = () => React.useContext(ModelContext);

interface EntryRendererProps {
    entry: CmsEntry | null;
    model: CmsModelDefinition;
    components: Component[];
    children: React.ReactNode;
}

export const EntryRenderer = ({ entry, model, components, children }: EntryRendererProps) => {
    components.forEach(c => componentRegistry.register(c));
    refCache.setResolver(contentSdk);

    const storeConfig = useMemo((): EntryStoreConfig => {
        const refModels = model.metadata?.refModels;
        if (!refModels || Object.keys(refModels).length === 0) {
            return {};
        }
        return {
            refModels,
            refResolver: contentSdk
        };
    }, [model]);

    if (contentSdk.isEditing()) {
        const entryId = entry ? entry.entryId : getEntryIdFromUrl();
        return (
            <ModelContext.Provider value={model}>
                <ComponentsContext.Provider value={components}>
                    <ConnectToEntryEditor
                        modelId={model.modelId}
                        entryId={entryId}
                        storeConfig={storeConfig}
                    >
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
                <EntryStoreProvider entryId={entry.entryId} entry={entry} storeConfig={storeConfig}>
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
