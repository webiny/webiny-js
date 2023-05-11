import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import {
    AcoFolderCrud,
    AcoSearchRecordCrudBase,
    CreateAcoParams as ICreateAcoParams
} from "~/types";

export interface IAcoAppAddFieldCallable {
    (field: CmsModelField): void;
}

export interface IAcoAppRemoveFieldCallable {
    (id: string): void;
}

export interface IAcoApp {
    search: AcoSearchRecordCrudBase;
    folder: AcoFolderCrud;
    name: string;
    model: CmsModel;
    getFields: () => CmsModelField[];
    addField: IAcoAppAddFieldCallable;
    removeField: IAcoAppRemoveFieldCallable;
}

export interface IAcoAppParams {
    name: string;
    apiName: string;
    model: CmsModel;
    fields: CmsModelField[];
}

export type IAcoAppsOptions = ICreateAcoParams;

export interface IAcoApps {
    list: () => IAcoApp[];
    register: (app: IAcoAppParams) => Promise<IAcoApp>;
}

export interface IAcoAppRegisterParams extends Omit<IAcoAppParams, "model"> {
    model?: CmsModel;
}
