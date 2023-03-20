import { CmsModel as BaseCmsModel } from "@webiny/api-headless-cms/types";

export interface Tenant {
    id: string;
    name: string;
}

export interface CmsModel
    extends Omit<BaseCmsModel, "singularApiName" | "pluralApiName">,
        Pick<Partial<BaseCmsModel>, "singularApiName" | "pluralApiName"> {
    PK: string;
    SK: string;
    TYPE: string;
    _ct: string;
    _et: string;
    _md: string;
}

export interface I18NLocale {
    code: string;
}
