import gql from "graphql-tag";
import { FIELDS_FIELDS } from "../components/ContentModelEditor/Context/graphql";

export const GET_CONTENT_MODEL_BY_MODEL_ID = gql`
    query CmsGetContentModelByModelId($modelId: ID!) {
        getContentModel(modelId: $modelId) {
            data {
                modelId
                titleFieldId
                name
                fields {
                    ${FIELDS_FIELDS}
                }
                layout
            }
            error {
                code
                message
                data
            }
        }
    }
`;
