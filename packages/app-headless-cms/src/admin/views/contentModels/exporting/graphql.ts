import gql from "graphql-tag";

export const EXPORT_MODELS_QUERY = gql`
    query ExportCmsStructure($models: [String!]) {
        exportCmsStructure(models: $models) {
            data
            error {
                message
                code
                data
            }
        }
    }
`;
