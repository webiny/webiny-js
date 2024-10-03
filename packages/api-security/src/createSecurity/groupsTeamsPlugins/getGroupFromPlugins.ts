import { SecurityConfig } from "~/types";
import { listGroupsFromPlugins } from "./listGroupsFromPlugins";

export interface GetGroupFromPluginsParams {
    groupsProvider?: SecurityConfig["groupsProvider"];
    where: {
        tenant: string;
        id?: string;
        slug?: string;
    };
}

export const getGroupFromPlugins = async (params: GetGroupFromPluginsParams) => {
    const { groupsProvider, where } = params;
    const [group] = await listGroupsFromPlugins({
        groupsProvider,
        where: {
            tenant: where.tenant,
            id_in: where.id ? [where.id] : undefined,
            slug_in: where.slug ? [where.slug] : undefined
        }
    });

    return group;
};
