import interfaces from "./interfaces.gql.js";
import base from "./base.gql.js";
import apiKey from "./apiKey.gql.js";
import group from "./group.gql.js";
import team from "./team.gql.js";
import identity from "./identity.gql.js";

export interface CreateGraphQlPluginsParams {
    teams?: boolean;
}

export default ({ teams }: CreateGraphQlPluginsParams) => {
    const plugins = [interfaces, base, apiKey, group, identity];
    if (teams) {
        plugins.push(team);
    }

    return plugins;
};
