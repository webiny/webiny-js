import upperFirst from "lodash/upperFirst";
import gql from "graphql-tag";

const ERROR_FIELD = /* GraphQL */ `
    {
        message
        code
        data
    }
`;

export const FIELDS_FIELDS = `
        _id
        fieldId
        type
        label {
            value
        }
        placeholderText {
            value
        }
        helpText {
            value
        }
        options {
            label {
                value
            }
            value
        }
        validation {
            name
            settings
            message {
                value
            }
        }
        `;

const createPublishMutation = ({ ucFirstModelId }) => gql`
    mutation Publish${ucFirstModelId}($revision: ID!) {
        publish${ucFirstModelId}(revision: $revision) {
            data {
                id
                meta {
                    published
                    status
                    locked
                }
            }
            error ${ERROR_FIELD}
        }
    }
`;

const createUnpublishHMutation = ({ ucFirstModelId }) => gql`
    mutation Unpublish${ucFirstModelId}($revision: ID!) {
        unpublish${ucFirstModelId}(revision: $revision) {
            data {
                id
                meta {
                    published
                    status
                    locked
                }
            }
            error ${ERROR_FIELD}
        }
    }
`;

export function createCrudQueriesAndMutations(model) {
    const ucFirstModelId = upperFirst(model.modelId);

    return {
        PUBLISH_CONTENT_ENTRY: createPublishMutation({ ucFirstModelId }),
        UNPUBLISH_CONTENT_ENTRY: createUnpublishHMutation({ ucFirstModelId })
    };
}
