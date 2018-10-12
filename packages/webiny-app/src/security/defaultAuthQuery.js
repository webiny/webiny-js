import gql from "graphql-tag";
export default gql`
    {
        security {
            getCurrentUser {
                id
                email
                firstName
                lastName
                scopes
            }
        }
    }
`;
