import gql from "graphql-tag";

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
