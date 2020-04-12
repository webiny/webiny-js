import gql from "graphql-tag";

export const GET_CONTENT_MODEL_BY_MODEL_ID = gql`
    query getContentBySlug($modelId: String) {
        getContentModel(where: { modelId: $modelId }) {
            data {
                title
                id
            }
        }
    }
`;
