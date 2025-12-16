import { SortPages } from "~/features/pages/loadPages/SortPages.js";
import type { OnDataTableSortingChange } from "@webiny/admin-ui";
import type { ColumnSorting } from "@webiny/app-utils";
import { SortingMapper } from "@webiny/app-utils";
import { useListPagesGateway } from "~/features/pages/loadPages/useListPagesGateway.js";

export const useSortPages = () => {
    const gateway = useListPagesGateway(["properties", "metadata"]);

    const sortPages: OnDataTableSortingChange = async updaterOrValue => {
        let newSorts: ColumnSorting[] = [];

        if (typeof updaterOrValue === "function") {
            newSorts = updaterOrValue(newSorts || []);
        }

        const params = {
            sorts: newSorts.map(sort => SortingMapper.fromColumnToDTO(sort))
        };

        const instance = SortPages.getInstance(gateway);
        return instance.execute(params);
    };

    return {
        sortPages
    };
};
