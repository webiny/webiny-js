import gql from "graphql-tag";
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";

export const createListQuery = model => {
    const ucFirstPluralizedModelId = upperFirst(pluralize(model.modelId));
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query CmsList${ucFirstPluralizedModelId}($where: ${ucFirstModelId}ListWhereInput) {
            content: list${ucFirstPluralizedModelId}(where: $where) {
                data {
                    id
                    meta {
                        status
                        modelId
                        title
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    `;
};

export const createGetByIdsQuery = model => {
    const ucFirstPluralizedModelId = upperFirst(pluralize(model.modelId));

    return gql`
        query CmsGet${ucFirstPluralizedModelId}ByIds($revisions: [ID!]!) {
            content: get${ucFirstPluralizedModelId}ByIds(revisions: $revisions) {
                data {
                    id
                    meta {
                        status
                        modelId
                        title
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    `;
};

export const createGetQuery = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query CmsGet${ucFirstModelId}($revision:ID!) {
            content: get${ucFirstModelId}(revision: $revision) {
                data {
                    id
                    meta {
                        status
                        modelId
                        title
                    }
                }
            }
        }
    `;
};

export const GET_CONTENT_MODEL = gql`
    query CmsGetContentModel($modelId: ID!) {
        getContentModel(modelId: $modelId) {
            data {
                modelId
                titleFieldId
            }
        }
    }
`;
