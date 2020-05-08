import gql from "graphql-tag";
import { FIELDS_FIELDS } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context/graphql";

export const GET_CONTENT_MODEL_BY_MODEL_ID = gql`
    query getContentBySlug($modelId: String) {
        getContentModel(where: { modelId: $modelId }) {
            data {
                id
                modelId
                pluralizedModelId
                name
                pluralizedName
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
