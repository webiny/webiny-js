import gql from "graphql-tag";
import { CmsErrorResponse, CmsModelField } from "@webiny/app-headless-cms-common/types";
import { ImportAction, ValidatedCmsGroup, ValidatedCmsModel } from "./types";

const ERROR = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

export interface ValidateImportStructureResponseData {
    groups: ValidatedCmsGroup[];
    models: ValidatedCmsModel[];
    message: string;
}

export interface ValidateImportStructureResponse {
    validateImportStructure: {
        data: ValidateImportStructureResponseData | null;
        error: CmsErrorResponse | null;
    };
}

export const VALIDATE_IMPORT_STRUCTURE = gql`
    mutation ValidateStructureImport($data: CmsImportStructureInput!) {
        validateImportStructure(data: $data) {
            data {
                groups {
                    group {
                        id
                        name
                    }
                    action
                    ${ERROR}
                }
                models {
                    model {
                        modelId
                        name
                        group
                    }
                    related
                    action
                    ${ERROR}
                }
                message
            }
            ${ERROR}
        }
    }
`;

export interface ImportStructureVariablesGroup {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    icon: string;
}

export interface ImportStructureVariablesModel {
    name: string;
    singularApiName: string;
    pluralApiName: string;
    modelId: string;
    group: string;
    icon?: string;
    description?: string;
    layout: string[][];
    fields: CmsModelField[];
    titleFieldId: string;
    descriptionFieldId?: string;
    imageFieldId?: string;
    tags?: string[];
}

export interface ImportStructureVariables {
    data: {
        groups: ImportStructureVariablesGroup[];
        models: ImportStructureVariablesModel[];
    };
}

export interface ImportStructureResponseDataGroup {
    group: {
        id: string;
        name: string;
    };
    action: ImportAction;
    error: CmsErrorResponse | null;
    imported: boolean;
}

export interface ImportStructureResponseDataModel {
    model: {
        modelId: string;
        name: string;
        group: string;
    };
    action: ImportAction;
    related: string[] | null;
    error: CmsErrorResponse | null;
    imported: boolean;
}

export interface ImportStructureResponseData {
    groups: ImportStructureResponseDataGroup[];
    models: ImportStructureResponseDataModel[];
    message: string;
}

export interface ImportStructureResponse {
    importStructure: {
        data: ImportStructureResponseData | null;
        error: CmsErrorResponse | null;
    };
}

export const IMPORT_STRUCTURE = gql`
    mutation StructureImport($data: CmsImportStructureInput!) {
        importStructure(data: $data) {
            data {
                groups {
                    group {
                        id
                        name
                    }
                    imported
                    action
                    ${ERROR}
                }
                models {
                    model {
                        modelId
                        name
                        group
                    }
                    imported
                    related
                    action
                    ${ERROR}
                }
                message
            }
            ${ERROR}
        }
    }
`;
