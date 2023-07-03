import React, { useMemo } from "react";
import { useSecurity } from "@webiny/app-security";
import { CmsModel, CmsSecurityPermission } from "~/types";

export interface ContentEntriesContext {
    contentModel: CmsModel;
    canCreate: boolean;
    insideDialog?: boolean;
}

export const Context = React.createContext<ContentEntriesContext | undefined>(undefined);

export interface ContentEntriesContextProviderProps {
    contentModel: CmsModel;
    children: React.ReactNode;
    insideDialog?: boolean;
}

export const ContentEntriesProvider: React.FC<ContentEntriesContextProviderProps> = ({
    contentModel,
    children,
    insideDialog
}) => {
    const { identity, getPermission } = useSecurity();

    const canCreate = useMemo((): boolean => {
        const permission = getPermission<CmsSecurityPermission>("cms.contentEntry");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, [identity]);

    const value = {
        insideDialog,
        contentModel,
        canCreate
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

ContentEntriesProvider.displayName = "ContentEntriesProvider";
