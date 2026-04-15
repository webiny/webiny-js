import React from "react";
import type { CmsModel } from "~/types.js";
import { usePermission } from "~/admin/hooks/usePermission.js";

export interface ContentEntriesContext {
    contentModel: CmsModel;
    canCreate: boolean;
    insideDialog?: boolean;
}

export const ContentEntriesContext = React.createContext<ContentEntriesContext | undefined>(
    undefined
);

export interface ContentEntriesContextProviderProps {
    contentModel: CmsModel;
    children: React.ReactNode;
    insideDialog?: boolean;
}

export const ContentEntriesProvider = ({
    contentModel,
    children,
    insideDialog
}: ContentEntriesContextProviderProps) => {
    const { canCreate: canCreateEntries } = usePermission();
    const canCreate = canCreateEntries("cms.contentEntry");

    const value = {
        insideDialog,
        contentModel,
        canCreate
    };

    return (
        <ContentEntriesContext.Provider value={value}>{children}</ContentEntriesContext.Provider>
    );
};

ContentEntriesProvider.displayName = "ContentEntriesProvider";
