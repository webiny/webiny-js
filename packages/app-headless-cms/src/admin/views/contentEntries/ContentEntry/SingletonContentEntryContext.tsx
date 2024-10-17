import React, { useEffect, useState } from "react";
import { useSnackbar, useIsMounted } from "@webiny/app-admin";
import { useCms } from "~/admin/hooks";
import { useContentEntries } from "~/admin/views/contentEntries/hooks/useContentEntries";
import type { CmsContentEntry, CmsModel } from "~/types";
import type * as Cms from "~/admin/contexts/Cms";

export type UpdateEntryParams = Omit<Cms.UpdateEntryRevisionParams, "model">;

export interface SingletonContentEntryCrud {
    updateEntry: (params: UpdateEntryParams) => Promise<Cms.UpdateEntryRevisionResponse>;
}

export interface SingletonContentEntryContext extends SingletonContentEntryCrud {
    contentModel: CmsModel;
    entry: CmsContentEntry;
    loading: boolean;
}

export const SingletonContentEntryContext = React.createContext<
    SingletonContentEntryContext | undefined
>(undefined);

export interface ContentEntryContextProviderProps {
    children: React.ReactNode;
}

export const SingletonContentEntryProvider = ({ children }: ContentEntryContextProviderProps) => {
    const { isMounted } = useIsMounted();
    const [entry, setEntry] = useState<CmsContentEntry>();
    const { contentModel: model } = useContentEntries();
    const { showSnackbar } = useSnackbar();
    const cms = useCms();
    const [isLoading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const { entry, error } = await cms.getSingletonEntry({ model });
            setLoading(false);

            if (!isMounted()) {
                return;
            }

            if (!error) {
                setEntry(entry);
                return;
            }
            showSnackbar(error.message);
        })();
    }, []);

    const updateEntry: SingletonContentEntryCrud["updateEntry"] = async params => {
        setLoading(true);
        const response = await cms.updateSingletonEntry({ model, ...params });
        setLoading(false);
        if (response.entry) {
            setEntry(response.entry);
        }
        return response;
    };

    const value: SingletonContentEntryContext = {
        contentModel: model,
        entry: (entry || {}) as CmsContentEntry,
        loading: isLoading,
        updateEntry
    };

    return (
        <SingletonContentEntryContext.Provider value={value}>
            {children}
        </SingletonContentEntryContext.Provider>
    );
};

SingletonContentEntryProvider.displayName = "SingletonContentEntryProvider";
