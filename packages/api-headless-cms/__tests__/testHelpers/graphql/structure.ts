import { CmsImportStructureParamsData } from "~/export/types";

export interface CmsExportStructureQueryVariables {
    models?: string[];
}

export interface CmsImportStructureMutationVariables {
    data: CmsImportStructureParamsData;
    models: string[];
}

export interface CmsValidateStructureMutationVariables {
    data: CmsImportStructureParamsData;
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
        ${ERROR_FIELD}
    }
`;
const MODELS_FIELD = /* GraphQL */ `
    models {
        model {
            modelId
            name
        }
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
        $models: [String!]!
    ) {
        importStructure(data: $data, models: $models) {
            data {
                ${GROUPS_FIELD}
                ${MODELS_FIELD}
                message
            }
            ${ERROR_FIELD}
        }
    }
`;
