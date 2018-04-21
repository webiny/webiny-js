import gql from "graphql-tag";

// TODO: move this into a client-side `credentials` strategy
// which knows the query structure and default fields

const identityFields = `
id
email
firstName
lastName
gravatar
roles {
    slug
}
roleGroups {
    id
    name
    roles {
        slug
    }
}
`;

export default {
    identity: "SecurityUser",
    fields: identityFields,
    authenticate: [
        {
            strategy: "credentials",
            query: gql`
                query login($username: String!, $password: String!, $remember: Boolean) {
                    me: loginSecurityUser(
                        username: $username
                        password: $password
                        remember: $remember
                    ) {
                        identity {
                            ${identityFields}
                        }
                        token
                        expiresOn
                    }
                }
            `
        }
    ]
};
