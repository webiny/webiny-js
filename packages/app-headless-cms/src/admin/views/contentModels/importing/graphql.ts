import gql from "graphql-tag";
import { CmsErrorResponse } from "@webiny/app-headless-cms-common/types";
import { ValidatedCmsGroup, ValidatedCmsModel } from "./types";

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

export interface ImportStructureResponseDataGroup {
    group: {
        id: string;
        name: string;
    };
    error: CmsErrorResponse | null;
    imported: boolean;
}

export interface ImportStructureResponseDataModel {
    model: {
        modelId: string;
        name: string;
        group: string;
    };
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
    mutation StructureImport($data: CmsImportStructureInput!, $models: [String!]!) {
        importStructure(data: $data, models: $models) {
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
