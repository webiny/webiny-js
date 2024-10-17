import { SecurityConfig } from "~/types";
import { listGroupsFromProvider } from "./listGroupsFromProvider";

export interface GetGroupFromPluginsParams {
    groupsProvider?: SecurityConfig["groupsProvider"];
    where: {
        tenant: string;
        id?: string;
        slug?: string;
    };
}

export const getGroupFromProvider = async (params: GetGroupFromPluginsParams) => {
    const { groupsProvider, where } = params;
    const [group] = await listGroupsFromProvider({
        groupsProvider,
        where: {
            tenant: where.tenant,
            id_in: where.id ? [where.id] : undefined,
            slug_in: where.slug ? [where.slug] : undefined
        }
    });

    return group;
};
