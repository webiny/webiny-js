const DATA_FIELD = (extra = "") => /* GraphQL */ `
    {
        name
        description
        slug
        groups {
            id
            name
        }
        ${extra}
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_SECURITY_TEAM = /* GraphQL */ `
    mutation CreateTeam($data: SecurityTeamCreateInput!) {
        security {
            createTeam(data: $data) {
                data ${DATA_FIELD("id")}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_SECURITY_TEAM = /* GraphQL */ `
    mutation UpdateTeam($id: ID!, $data: SecurityTeamUpdateInput!) {
        security {
            updateTeam(id: $id, data: $data) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_SECURITY_TEAM = /* GraphQL */ `
    mutation DeleteTeam($id: ID!) {
        security {
            deleteTeam(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_SECURITY_TEAMS = /* GraphQL */ `
    query ListTeams {
        security {
            listTeams {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SECURITY_TEAM = /* GraphQL */ `
    query GetTeam($id: ID!) {
        security {
            getTeam(where: { id: $id }) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;
