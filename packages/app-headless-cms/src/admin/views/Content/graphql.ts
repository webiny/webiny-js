import gql from "graphql-tag";
import { FIELDS_FIELDS } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context/graphql";

export const GET_CONTENT_MODEL_BY_MODEL_ID = gql`
    query getContentBySlug($modelId: String) {
        getContentModel(where: { modelId: $modelId }) {
            data {
                modelId
                pluralizedModelId
                title
                pluralizedName
                fields {
                    ${FIELDS_FIELDS}
                }
                layout
                id
            }
            error {
                code
                message
                data
            }
        }
    }
`;
