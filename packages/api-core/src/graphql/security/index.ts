import base from "./base.gql.js";
import apiKey from "./apiKey.gql.js";
import role from "./role.gql.js";
import team from "./team.gql.js";
import identity from "./identity.gql.js";

export interface CreateGraphQlPluginsParams {
    teams?: boolean;
}

export const createSecurityGraphQL = ({ teams }: CreateGraphQlPluginsParams) => {
    const plugins = [base, apiKey, role, identity];
    if (teams) {
        plugins.push(team);
    }

    return plugins;
};
