import { SecurityConfig } from "~/types";
import { listTeamsFromPlugins } from "./listTeamsFromPlugins";

export interface GetTeamFromPluginsParams {
    listTeamsFromPluginsCallback?: SecurityConfig["listTeamsFromPluginsCallback"];
    where: {
        tenant: string;
        id?: string;
        slug?: string;
    };
}

export const getTeamFromPlugins = (params: GetTeamFromPluginsParams) => {
    const { listTeamsFromPluginsCallback, where } = params;
    const [team] = listTeamsFromPlugins({
        listTeamsFromPluginsCallback,
        where: {
            tenant: where.tenant,
            id_in: where.id ? [where.id] : undefined,
            slug_in: where.slug ? [where.slug] : undefined
        }
    });

    return team;
};
