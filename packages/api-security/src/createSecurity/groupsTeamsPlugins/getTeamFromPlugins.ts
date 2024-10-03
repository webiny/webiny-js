import { SecurityConfig } from "~/types";
import { listTeamsFromPlugins } from "./listTeamsFromPlugins";

export interface GetTeamFromPluginsParams {
    teamsProvider?: SecurityConfig["teamsProvider"];
    where: {
        tenant: string;
        id?: string;
        slug?: string;
    };
}

export const getTeamFromPlugins = async (params: GetTeamFromPluginsParams) => {
    const { teamsProvider, where } = params;
    const [team] = await listTeamsFromPlugins({
        teamsProvider,
        where: {
            tenant: where.tenant,
            id_in: where.id ? [where.id] : undefined,
            slug_in: where.slug ? [where.slug] : undefined
        }
    });

    return team;
};
