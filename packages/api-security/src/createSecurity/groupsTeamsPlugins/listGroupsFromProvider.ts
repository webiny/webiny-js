import { SecurityConfig } from "~/types";

export interface ListGroupsFromPluginsParams {
    groupsProvider?: SecurityConfig["groupsProvider"];
    where: {
        tenant: string;
        id_in?: string[];
        slug_in?: string[];
    };
}

export const listGroupsFromProvider = async (params: ListGroupsFromPluginsParams) => {
    const { groupsProvider, where } = params;
    if (!groupsProvider) {
        return [];
    }

    const groups = await groupsProvider();

    return groups.filter(group => {
        // First we ensure the group belongs to the correct tenant.
        if (group.tenant) {
            if (group.tenant !== where.tenant) {
                return false;
            }
        }

        const { id_in, slug_in } = where;
        if (id_in) {
            if (!id_in.includes(group.id)) {
                return false;
            }
        }

        if (slug_in) {
            if (!slug_in.includes(group.id)) {
                return false;
            }
        }

        return group;
    });
};
