import { CmsGroup, CmsModel } from "~/types";

export interface CmsImportError {
    message: string;
    code: string | null;
    data?: Record<string, any> | null;
    stack?: any;
}

export enum CmsImportAction {
    CREATE = "create",
    UPDATE = "update",
    CODE = "code",
    NONE = "none"
}
/**
 * Structure export - groups and models.
 */

export interface HeadlessCmsExportStructureParams {
    models?: string[];
}

export type SanitizedCmsGroup = Pick<CmsGroup, "id" | "name" | "slug" | "description" | "icon">;

export interface SanitizedCmsModel
    extends Pick<
        CmsModel,
        | "modelId"
        | "fields"
        | "titleFieldId"
        | "descriptionFieldId"
        | "imageFieldId"
        | "layout"
        | "icon"
        | "singularApiName"
        | "pluralApiName"
        | "name"
        | "description"
        | "tags"
    > {
    group: string;
}

export interface HeadlessCmsExportStructureResponse {
    groups: SanitizedCmsGroup[];
    models: SanitizedCmsModel[];
}

export interface HeadlessCmsExportStructure {
    (params: HeadlessCmsExportStructureParams): Promise<HeadlessCmsExportStructureResponse>;
}

export interface HeadlessCmsImportStructureParamsDataModel
    extends Omit<Partial<CmsModel>, "group"> {
    group?: string;
}

export interface CmsImportStructureParamsData {
    groups: Partial<CmsGroup>[];
    models: HeadlessCmsImportStructureParamsDataModel[];
}

export interface HeadlessCmsImportStructureParams {
    data: CmsImportStructureParamsData;
}

export interface HeadlessCmsImportValidateParams {
    data: CmsImportStructureParamsData;
}

export interface CmsGroupImportResult {
    action: CmsImportAction;
    group: Partial<Pick<CmsGroup, "id" | "name">>;
    error?: CmsImportError;
    imported: boolean;
}

export interface CmsModelImportResult {
    action: CmsImportAction;
    model: Partial<Pick<CmsModel, "modelId" | "name">> & {
        group: string;
    };
    related?: string[] | null;
    error?: CmsImportError;
    imported: boolean;
}

export interface HeadlessCmsImportStructureResponse {
    groups: CmsGroupImportResult[];
    models: CmsModelImportResult[];
    message?: string | null;
    error?: string;
}

export interface HeadlessCmsImportStructure {
    (params: HeadlessCmsImportStructureParams): Promise<HeadlessCmsImportStructureResponse>;
}

export interface ValidCmsGroupResult {
    group: CmsGroup;
    action: CmsImportAction;
    target?: string;
    error?: never;
}

export interface InvalidCmsGroupResult {
    group: CmsGroup;
    action: CmsImportAction;
    target?: never;
    error: CmsImportError;
}

export interface ValidatedCmsModel extends Omit<CmsModel, "group"> {
    group: string;
}
export interface ValidCmsModelResult {
    model: ValidatedCmsModel;
    related: string[];
    action: CmsImportAction;
    error?: never;
}

export interface InvalidCmsModelResult {
    model: ValidatedCmsModel;
    action: CmsImportAction;
    error: CmsImportError;
}

export type ValidatedCmsGroupResult = ValidCmsGroupResult | InvalidCmsGroupResult;
export type ValidatedCmsModelResult = ValidCmsModelResult | InvalidCmsModelResult;

export interface HeadlessCmsImportValidateResponse {
    groups: ValidatedCmsGroupResult[];
    models: ValidatedCmsModelResult[];
    message: string;
}

export interface HeadlessCmsImportValidate {
    (params: HeadlessCmsImportValidateParams): Promise<HeadlessCmsImportValidateResponse>;
}

/**
 * Interface for the main context interface.
 */
export interface HeadlessCmsExport {
    structure: HeadlessCmsExportStructure;
}

export interface HeadlessCmsImport {
    validate: HeadlessCmsImportValidate;
    structure: HeadlessCmsImportStructure;
}
