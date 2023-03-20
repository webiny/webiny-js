export interface Tenant {
    id: string;
    name: string;
}

export interface CmsModel {
    modelId: string;
    singularApiName: string;
    pluralApiName: string;
    tenant: string;
    locale: string;
}

export interface I18NLocale {
    code: string;
}
