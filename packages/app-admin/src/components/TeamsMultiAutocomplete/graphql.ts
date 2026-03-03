import gql from "graphql-tag";

export interface ITeam {
    id: string;
    slug: string;
    name: string;
    description: string;
    createdOn: string;
}

export interface IListTeamsResponse {
    security: {
        teams: {
            data: ITeam[];
        };
    };
}

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
