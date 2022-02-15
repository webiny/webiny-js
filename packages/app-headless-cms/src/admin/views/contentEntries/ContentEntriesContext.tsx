import React, { useState, useMemo, Dispatch, SetStateAction } from "react";
import { useSecurity } from "@webiny/app-security";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorContentModel } from "~/types";

const t = i18n.ns("app-headless-cms/admin/contents/entries");

export interface CmsEntriesSorter {
    label: string;
    value: string;
}
const SORTERS: CmsEntriesSorter[] = [
    {
        label: t`Newest to oldest`,
        value: "savedOn_DESC"
    },
    {
        label: t`Oldest to newest`,
        value: "savedOn_ASC"
    }
];

export interface ListQueryVariables {
    sort?: string[];
    status?: string;
    where?: {
        [key: string]: any;
    };
}

export interface ContentEntriesContext {
    contentModel: CmsEditorContentModel;
    sorters: CmsEntriesSorter[];
    canCreate: boolean;
    listQueryVariables: ListQueryVariables;
    setListQueryVariables: Dispatch<SetStateAction<ListQueryVariables>>;
    insideDialog?: boolean;
}

export const Context = React.createContext<ContentEntriesContext>(null);

export interface ContentEntriesContextProviderProps {
    contentModel: CmsEditorContentModel;
    children: React.ReactNode;
    insideDialog?: boolean;
}

export const Provider: React.FC<ContentEntriesContextProviderProps> = ({
    contentModel,
    children,
    insideDialog
}) => {
    const { identity } = useSecurity();

    const [listQueryVariables, setListQueryVariables] = useState<ListQueryVariables>({
        sort: [SORTERS[0].value]
    });

    const canCreate = useMemo((): boolean => {
        const permission = identity.getPermission("cms.contentEntry");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, []);

    const sorters = useMemo((): CmsEntriesSorter[] => {
        const titleField = contentModel.fields.find(
            field => field.fieldId === contentModel.titleFieldId
        );
        const titleFieldLabel = titleField ? titleField.label : null;
        if (!titleFieldLabel) {
            return SORTERS;
        }

        return [
            ...SORTERS,
            {
                label: t`{titleFieldLabel} A-Z`({ titleFieldLabel }),
                value: `${contentModel.titleFieldId}_ASC`
            },
            {
                label: t`{titleFieldLabel} Z-A`({ titleFieldLabel }),
                value: `${contentModel.titleFieldId}_DESC`
            }
        ];
    }, [contentModel.modelId]);

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

Provider.displayName = "ContentEntriesProvider";
