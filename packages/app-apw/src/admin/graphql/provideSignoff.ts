import gql from "graphql-tag";

const ERROR_FIELDS = `{
    message
    code
    data
}`;

export const PROVIDE_SIGN_OFF_MUTATION = /* GraphQL */ gql`
    mutation ProvideSignOffMutation($id: ID!, $step: String!) {
        apw {
            provideSignOff(id: $id, step: $step) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const RETRACT_SIGN_OFF_MUTATION = /* GraphQL */ gql`
    mutation RetractSignOffMutation($id: ID!, $step: String!) {
        apw {
            retractSignOff(id: $id, step: $step) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const PUBLISH_CONTENT_MUTATION = /* GraphQL */ gql`
    mutation PublishContentMutation($id: ID!) {
        apw {
            publishContent(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UNPUBLISH_CONTENT_MUTATION = /* GraphQL */ gql`
    mutation UnpublishContentMutation($id: ID!) {
        apw {
            unpublishContent(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;
