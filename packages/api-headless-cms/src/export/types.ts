import { CmsGroup, CmsModel } from "~/types";

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
    group: Pick<CmsGroup, "id" | "name">;
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
    structure: HeadlessCmsExportStructure;
}
