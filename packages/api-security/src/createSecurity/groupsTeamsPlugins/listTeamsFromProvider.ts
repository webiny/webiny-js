import { SecurityConfig } from "~/types";

export interface ListTeamsFromPluginsParams {
    teamsProvider?: SecurityConfig["teamsProvider"];
    where: {
        tenant: string;
        id_in?: string[];
        slug_in?: string[];
    };
}

export const listTeamsFromProvider = async (params: ListTeamsFromPluginsParams) => {
    const { teamsProvider, where } = params;
    if (!teamsProvider) {
        return [];
    }

    const teams = await teamsProvider();

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
