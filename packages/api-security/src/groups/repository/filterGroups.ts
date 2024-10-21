import type { Group } from "~/types";

export interface FilterGroupsParams {
    id_in?: string[];
    slug_in?: string[];
    tenant: string;
}

export const createFilter = (where: FilterGroupsParams) => {
    return (group: Group) => {
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

        return true;
    };
};
