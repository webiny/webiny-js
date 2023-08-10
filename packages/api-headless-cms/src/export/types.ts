import { CmsGroup, CmsModel } from "~/types";

export interface HeadlessCmsExportModelsResponse {
    url: string;
    json: string;
}

export interface HeadlessCmsExportModelsParams {
    code: boolean;
    groups?: string[];
}

export interface HeadlessCmsExportModels {
    (params: HeadlessCmsExportModelsParams): Promise<HeadlessCmsExportModelsResponse>;
}

/**
 * Groups export.
 */
export interface HeadlessCmsExportGroupsResponse {
    url: string;
    json: string;
}

export interface HeadlessCmsExportGroupsParams {
    code: boolean;
}

export interface HeadlessCmsExportGroups {
    (params: HeadlessCmsExportGroupsParams): Promise<HeadlessCmsExportGroupsResponse>;
}

/**
 * Structure export - groups and models.
 */
export interface HeadlessCmsExportStructureParamsTargets {
    id: string;
    models?: string[];
}

export interface HeadlessCmsExportStructureParams {
    code: boolean;
    targets?: HeadlessCmsExportStructureParamsTargets[];
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
    group: Pick<CmsGroup, "id" | "slug" | "name">;
}

export interface HeadlessCmsExportStructureResponse {
    groups: SanitizedCmsGroup[];
    models: SanitizedCmsModel[];
}

export interface HeadlessCmsExportStructure {
    (params: HeadlessCmsExportStructureParams): Promise<HeadlessCmsExportStructureResponse>;
}

/**
 * Interface for the main context interface.
 */
export interface HeadlessCmsExport {
    // groups: HeadlessCmsExportGroups;
    // models: HeadlessCmsExportModels;
    structure: HeadlessCmsExportStructure;
}
