export interface Tenant {
    data: {
        id: string;
        name: string;
    };
}

export interface CmsModel {
    PK: string;
    SK: string;
    TYPE: string;
    _ct: string;
    _et: string;
    _md: string;
    name: string;
    modelId: string;
    singularApiName?: string;
    pluralApiName?: string;
    tenant: string;
    locale: string;
    group: {
        id: string;
        name: string;
    };
    icon?: string | null;
    description: string;
    createdOn?: string;
    savedOn?: string;
    createdBy: {
        id: string;
        type: string;
        displayName: string;
    };
    fields: any[];
    layout: string[][];
    tags?: string[];
    lockedFields: any[];
    titleFieldId: string;
    webinyVersion: string;
}

export interface I18NLocale {
    code: string;
}
