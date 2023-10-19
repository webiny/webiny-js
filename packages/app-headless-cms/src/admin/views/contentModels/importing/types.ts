import { CmsErrorResponse } from "@webiny/app-headless-cms-common/types";

export enum ImportAction {
    UPDATE = "update",
    CREATE = "create",
    CODE = "code",
    NONE = "none"
}

export interface ValidatedCmsGroup {
    group: {
        id: string;
        name: string;
    };
    action: ImportAction;
    error: CmsErrorResponse | null;
}

export interface ValidatedCmsModel {
    model: {
        modelId: string;
        name: string;
        group: string;
    };
    related: string[];
    action: ImportAction;
    error: CmsErrorResponse | null;
}

export interface InvalidField {
    message: string;
    data: {
        path: string[];
    };
    code: string;
}

export interface ImportGroupData {
    id: string;
    name: string;
    action?: ImportAction;
    error: CmsErrorResponse | null;
    message?: string;
    imported?: boolean;
}

export interface ImportModelData {
    id: string;
    name: string;
    group: string;
    related: string[];
    error: CmsErrorResponse | null;
    action?: ImportAction;
    message?: string | null;
    imported?: boolean;
}
