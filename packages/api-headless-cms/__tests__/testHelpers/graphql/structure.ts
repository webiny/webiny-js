import { CmsImportStructureParamsData, HeadlessCmsImportValidateResponse } from "~/export/types";
import { CmsError } from "~tests/contentAPI/aco/setup/graphql/contentEntry";

export interface CmsExportStructureQueryVariables {
    models?: string[];
}

export interface CmsImportStructureMutationVariables {
    data: CmsImportStructureParamsData;
}

export interface CmsValidateStructureMutationVariables {
    data: CmsImportStructureParamsData;
}

export interface CmsValidateStructureMutationResponse {
    data: {
        validateImportStructure: {
            data: HeadlessCmsImportValidateResponse | null;
            error: CmsError | null;
        };
    };
}

const ERROR_FIELD = /* GraphQL */ `
    error {
        message
        code
        data
    }
`;

const GROUPS_FIELD = /* GraphQL */ `
    groups {
        group {
            id
            name
        }
        action
        ${ERROR_FIELD}
    }
`;
const MODELS_FIELD = /* GraphQL */ `
    models {
        model {
            modelId
            name
        }
        related
        action
        ${ERROR_FIELD}
    }
`;

const IMPORTED_GROUPS_FIELD = /* GraphQL */ `
    groups {
        group {
            id
            name
        }
        action
        imported
        ${ERROR_FIELD}
    }
`;
const IMPORTED_MODELS_FIELD = /* GraphQL */ `
    models {
        model {
            modelId
            name
        }
        related
        action
        imported
        ${ERROR_FIELD}
    }
`;

export const CMS_EXPORT_STRUCTURE_QUERY = /* GraphQL */ `
    query CmsExportStructureQuery($models: [String!]) {
        exportStructure(models: $models) {
            data
            error {
                message
                code
                data
                stack
            }
        }
    }
`;

export const CMS_VALIDATE_STRUCTURE_MUTATION = /* GraphQL */ `
    mutation CmsValidateStructureMutation($data: CmsImportStructureInput!) {
        validateImportStructure(data: $data) {
            data {
                ${GROUPS_FIELD}
                ${MODELS_FIELD}
                message
            }
            ${ERROR_FIELD}
        }
    }
`;

export const CMS_IMPORT_STRUCTURE_MUTATION = /* GraphQL */ `
    mutation CmsImportStructureMutation(
        $data: CmsImportStructureInput!
    ) {
        importStructure(data: $data) {
            data {
                ${IMPORTED_GROUPS_FIELD}
                ${IMPORTED_MODELS_FIELD}
                message
            }
            ${ERROR_FIELD}
        }
    }
`;
