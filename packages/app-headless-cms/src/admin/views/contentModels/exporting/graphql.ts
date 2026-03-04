import gql from "graphql-tag";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types/index.js";

export interface ICmsExportStructureResponse {
    exportStructure: {
        data?: string;
        error?: CmsErrorResponse;
    };
}

export const CMS_EXPORT_STRUCTURE_QUERY = gql`
    query CmsExportStructure($models: [String!]) {
        exportStructure(models: $models) {
            data
            error {
                message
                code
                data
            }
        }
    }
`;
