import gql from "graphql-tag";

const dataFields = /* GraphQL */ `
    {
        id
        email
        firstName
        lastName
        gravatar
        accessToken {
            token
        }
        onboarding {
            sites
        }
    }
`;

export const getCurrentUser = gql`
    {
        currentUser {
            data ${dataFields}
            error {
                code
                message
            }
        }
    }
`;

export const idTokenLogin = gql`
    mutation IdTokenLogin($idToken: String!) {
        login(idToken: $idToken) {
            data {
                token
                user ${dataFields}
            }
            error {
                code
                message
            }
        }
    }
`;
