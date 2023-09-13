import interfaces from "./interfaces.gql";
import base from "./base.gql";
import apiKey from "./apiKey.gql";
import group from "./group.gql";
import team from "./team.gql";
import install from "./install.gql";
import identity from "./identity.gql";
import identityProfiles from "./identityProfiles.gql";

export interface CreateGraphQlPluginsParams {
    teams?: boolean;
}

export default ({ teams }: CreateGraphQlPluginsParams) => {
    const plugins = [interfaces, base, apiKey, install, group, identity, identityProfiles];
    if (teams) {
        plugins.push(team);
    }

    return plugins;
};
