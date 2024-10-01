import { SecurityConfig } from "~/types";
import { listGroupsFromPlugins } from "./listGroupsFromPlugins";

export interface GetGroupFromPluginsParams {
    listGroupsFromPluginsCallback?: SecurityConfig["listGroupsFromPluginsCallback"];
    where: {
        tenant: string;
        id?: string;
        slug?: string;
    };
}

export const getGroupFromPlugins = (params: GetGroupFromPluginsParams) => {
    const { listGroupsFromPluginsCallback, where } = params;
    const [group] = listGroupsFromPlugins({
        listGroupsFromPluginsCallback,
        where: {
            tenant: where.tenant,
            id_in: where.id ? [where.id] : undefined,
            slug_in: where.slug ? [where.slug] : undefined
        }
    });

    return group;
};
