import gql from "graphql-tag";
import { Team } from "~/types";

const fields = `
    id
    name
    slug
    description
    groups {
        id
        slug
        name
    }
    system
    plugin
    createdOn
`;

export interface ListTeamsResponse {
    security: {
        teams: {
            data: Team[];
        };
    };
}

export const LIST_TEAMS = gql`
    query listTeams {
        security {
            teams: listTeams {
                data {
                    ${fields}
                }
            }
        }
    }
`;

export const READ_TEAM = gql`
    query getTeam($id: ID!) {
        security {
            team: getTeam(where: { id: $id }){
                data {
                    ${fields}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const CREATE_TEAM = gql`
    mutation createTeam($data: SecurityTeamCreateInput!){
        security {
            team: createTeam(data: $data) {
                data {
                    ${fields}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const UPDATE_TEAM = gql`
    mutation updateTeam($id: ID!, $data: SecurityTeamUpdateInput!){
        security {
            team: updateTeam(id: $id, data: $data) {
                data {
                    ${fields}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const DELETE_TEAM = gql`
    mutation deleteTeam($id: ID!) {
        security {
            deleteTeam(id: $id) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
