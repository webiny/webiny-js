import gql from "graphql-tag";
import type { Team } from "~/types.js";

const fields = `
    id
    name
    slug
    description
    roles {
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

export interface IReadTeamResponse {
    security: {
        team: {
            data: Team | null;
            error: Error | null;
        };
    };
}

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

export interface ICreateTeamResponse {
    security: {
        team: {
            data: Team | null;
            error: Error | null;
        };
    };
}

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

export interface IUpdateTeamResponse {
    security: {
        team: {
            data: Team | null;
            error: Error | null;
        };
    };
}

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

export interface IDeleteTeamResponse {
    security: {
        deleteTeam: {
            data: boolean;
            error: Error | null;
        };
    };
}

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
