import gql from "graphql-tag";

export const LIST_TEAMS = gql`
    query listTeams {
        security {
            listTeams {
                data {
                    id
                    slug
                    name
                    description
                    createdOn
                }
            }
        }
    }
`;

export const LIST_USERS = gql`
    query ListUsers {
        adminUsers {
            listUsers {
                data {
                    id
                    firstName
                    lastName
                    email
                    avatar
                    gravatar
                }
                error {
                    data
                    message
                    code
                }
            }
        }
    }
`;
