import { CmsGroup, CmsModel } from "~/types";

export interface CmsImportError {
    message: string;
    code: string | null;
    data?: Record<string, any> | null;
    stack?: any;
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
    models: string[];
}

export interface HeadlessCmsImportValidateParams {
    data: CmsImportStructureParamsData;
}

export interface CmsGroupImportResult {
    group: Partial<Pick<CmsGroup, "id" | "name">>;
    error?: CmsImportError;
    imported: boolean;
}

export interface CmsModelImportResult {
    model: Partial<Pick<CmsModel, "modelId" | "name">>;
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
    error?: never;
}

export interface InvalidCmsGroupResult {
    group: CmsGroup;
    error: CmsImportError;
}

export interface ValidCmsModelResult {
    model: Partial<Pick<CmsModel, "modelId" | "name">>;
    error?: never;
}

export interface InvalidCmsModelResult {
    model: Partial<Pick<CmsModel, "modelId" | "name">>;
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
