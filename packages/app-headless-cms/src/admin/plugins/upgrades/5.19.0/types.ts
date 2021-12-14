import { ApolloClient } from "apollo-client";
import { CmsEditorContentModel } from "~/types";

export interface Clients {
    read: ApolloClient<any>;
    manage: ApolloClient<any>;
}

export interface CurrentlyUpgrading {
    locale: string;
    model: CmsEditorContentModel;
    running: boolean;
    fetchingEntries: boolean;
    after: string;
    entry: string | null;
    totalCount: number | null;
    currentEntry: number | null;
    error?: {
        message: string;
        code: string;
        data: any;
    };
    entries: { id: string; done: boolean }[];
}

export interface UpgradeEntryItem {
    id: string;
    done: boolean;
}

export interface UpgradeModelItem {
    model: CmsEditorContentModel;
    entries: UpgradeEntryItem[];
    done: boolean;
    upgrading: boolean;
}

export interface UpgradeModelItems {
    [modelId: string]: UpgradeModelItem;
}

export interface UpgradeItems {
    loadedModels: boolean;
    locales: Record<string, UpgradeModelItems>;
}

export interface ErrorValue {
    code?: string;
    data?: any;
    message: string;
}
