import { useFeature } from "@webiny/app";
import { LoadPagesFeature } from "~/features/pages/loadPages/index.js";
import type { OnDataTableSortingChange } from "@webiny/admin-ui";
import type { ColumnSorting } from "@webiny/app-utils";
import { SortingMapper } from "@webiny/app-utils";

export const useSortPages = () => {
    const { sortPages: useCase } = useFeature(LoadPagesFeature);

    const sortPages: OnDataTableSortingChange = async updaterOrValue => {
        let newSorts: ColumnSorting[] = [];

        if (typeof updaterOrValue === "function") {
            newSorts = updaterOrValue(newSorts || []);
        }

        return useCase.execute({
            sorts: newSorts.map(sort => SortingMapper.fromColumnToDTO(sort))
        });
    };

    return { sortPages };
};
