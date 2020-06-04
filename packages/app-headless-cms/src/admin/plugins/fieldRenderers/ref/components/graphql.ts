import gql from "graphql-tag";
import upperFirst from "lodash/upperFirst";

export const createListQuery = model => {
    const ucFirstPluralizedModelId = upperFirst(model.pluralizedModelId);
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query List${ucFirstPluralizedModelId}($where: ${ucFirstModelId}ListWhereInput) {
            content: list${ucFirstPluralizedModelId}(where: $where) {
            data {
                id
                meta {
                    published
                    model
                    title {
                        value
                    }
                }
            }
        }
        }
    `;
};

export const createGetQuery = model => {
    const ucFirstModelId = upperFirst(model.modelId);
    return gql`
        query Get${ucFirstModelId}($where: ${ucFirstModelId}GetWhereInput!) {
            content: get${ucFirstModelId}(where: $where) {
            data {
                id
                meta {
                    published
                    model
                    title {
                        value
                    }
                }
            }
        }
        }
    `;
};

export const GET_CONTENT_MODEL = gql`
    query HeadlessCmsGetContentModel($where: JSON) {
        getContentModel(where: $where) {
            data {
                id
                pluralizedModelId
                modelId
                titleFieldId
            }
        }
    }
`;
