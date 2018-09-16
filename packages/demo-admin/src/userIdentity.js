// @flow
import gql from "graphql-tag";

// TODO: move this into a client-side `credentials` strategy
// which knows the query structure and default fields

const fields = `
    id
    email
    firstName
    lastName
    fullName
    avatar { src }
    groups {
        slug
    }
`;

const query = gql`
    query authenticate($username: String!, $password: String!) {
        Security {
            Users {
                authenticate(username: $username, password: $password) {
                    identity {
                        ${fields}
                    }
                    token
                    expiresOn
                }
            }
        }
    }
`;

export default {
    identity: "SecurityUser",
    fields,
    authenticate: [
        {
            strategy: "credentials",
            query
        }
    ]
};
