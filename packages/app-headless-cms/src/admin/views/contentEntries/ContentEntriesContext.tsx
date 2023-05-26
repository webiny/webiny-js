import React, { useState, useMemo, Dispatch, SetStateAction, useCallback } from "react";
import { useSecurity } from "@webiny/app-security";
import { i18n } from "@webiny/app/i18n";
import { CmsModel, CmsSecurityPermission } from "@webiny/app-headless-cms-common/types";
import {
    useContentEntriesViewConfig,
    ContentEntriesViewConfigSorter
} from "./experiment/ContentEntriesViewConfig";

const t = i18n.ns("app-headless-cms/admin/contents/entries");

export interface CmsEntriesSorter {
    label: string;
    value: string;
}

export interface ListQueryVariables {
    sort?: string[];
    status?: string;
    where?: {
        [key: string]: any;
    };
}

export interface ContentEntriesContext {
    contentModel: CmsModel;
    canCreate: boolean;
    listQueryVariables: ListQueryVariables;
    sorters: CmsEntriesSorter[];
    setListQueryVariables: Dispatch<SetStateAction<ListQueryVariables>>;
    insideDialog?: boolean;
}

export const Context = React.createContext<ContentEntriesContext | undefined>(undefined);

export interface ContentEntriesContextProviderProps {
    contentModel: CmsModel;
    children: React.ReactNode;
    insideDialog?: boolean;
}

function toEntriesSorters(sorters: ContentEntriesViewConfigSorter[]) {
    return sorters.map(s => ({ label: s.label, value: s.name }));
}

export const ContentEntriesProvider: React.FC<ContentEntriesContextProviderProps> = ({
    contentModel,
    children,
    insideDialog
}) => {
    const { identity, getPermission } = useSecurity();
    const viewConfig = useContentEntriesViewConfig();

    const appliesToContentModel = useCallback(
        ({ modelIds }: ContentEntriesViewConfigSorter) => {
            return modelIds.length === 0 || modelIds.includes(contentModel.modelId);
        },
        [contentModel]
    );

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

    const sorters = useMemo((): CmsEntriesSorter[] => {
        const titleField = contentModel.fields.find(
            field => field.fieldId === contentModel.titleFieldId
        );

        const titleFieldLabel = titleField ? titleField.label : null;
        if (!titleFieldLabel) {
            return toEntriesSorters(viewConfig.sorters.filter(appliesToContentModel));
        }

        return [
            ...toEntriesSorters(viewConfig.sorters.filter(appliesToContentModel)),
            {
                label: t`{titleFieldLabel} A-Z`({ titleFieldLabel }),
                value: `${contentModel.titleFieldId}_ASC`
            },
            {
                label: t`{titleFieldLabel} Z-A`({ titleFieldLabel }),
                value: `${contentModel.titleFieldId}_DESC`
            }
        ];
    }, [viewConfig.sorters, contentModel.modelId]);

    const [listQueryVariables, setListQueryVariables] = useState<ListQueryVariables>({
        sort: [sorters[0].value],
        where: {}
    });

    const value = {
        insideDialog,
        contentModel,
        sorters,
        canCreate,
        listQueryVariables,
        setListQueryVariables
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

ContentEntriesProvider.displayName = "ContentEntriesProvider";
