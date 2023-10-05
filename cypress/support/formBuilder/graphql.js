import { gql } from "graphql-request";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const DELETE_FORM = gql`
    mutation DeleteForm($id: ID!) {
        formBuilder {
            deleteForm(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
