export const LIST_TEAMS = /* GraphQL */ `
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
