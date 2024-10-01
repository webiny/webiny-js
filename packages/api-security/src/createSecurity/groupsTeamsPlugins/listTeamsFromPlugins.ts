import { SecurityConfig } from "~/types";

export interface ListTeamsFromPluginsParams {
    listTeamsFromPluginsCallback?: SecurityConfig["listTeamsFromPluginsCallback"];
    where: {
        tenant: string;
        id_in?: string[];
        slug_in?: string[];
    };
}

export const listTeamsFromPlugins = (params: ListTeamsFromPluginsParams) => {
    const { listTeamsFromPluginsCallback, where } = params;
    if (!listTeamsFromPluginsCallback) {
        return [];
    }

    const teams = listTeamsFromPluginsCallback().map(plugin => {
        return plugin.securityRole;
    });

    return teams.filter(team => {
        // First we ensure the team belongs to the correct tenant.
        if (team.tenant) {
            if (team.tenant !== where.tenant) {
                return false;
            }
        }

        const { id_in, slug_in } = where;
        if (id_in) {
            if (!id_in.includes(team.id)) {
                return false;
            }
        }

        if (slug_in) {
            if (!slug_in.includes(team.id)) {
                return false;
            }
        }

        return team;
    });
};
