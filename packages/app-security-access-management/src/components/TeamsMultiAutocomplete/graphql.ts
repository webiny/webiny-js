import gql from "graphql-tag";

export const LIST_TEAMS = gql`
    query listTeams {
        security {
            teams: listTeams {
                data {
                    id
                    slug
                    name
                    description
                    createdOn
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
