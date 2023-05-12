import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";

import { LIST_BLOCK_CATEGORIES } from "~/admin/views/BlockCategories/graphql";
import { PbBlockCategory } from "~/types";

export function useBlockCategories() {
    const { data } = useQuery(LIST_BLOCK_CATEGORIES);
    const blockCategoriesData: PbBlockCategory[] =
        get(data, "pageBuilder.listBlockCategories.data") || [];

    return blockCategoriesData;
}
