import { useCallback } from "react";
import orderBy from "lodash/orderBy";

import { PbBlockCategory, PbPageBlock } from "~/types";

const useFilteredCategoriesListData = (
    pageBlocksData: PbPageBlock[],
    blockCategoriesData: PbBlockCategory[],
    sort: string,
    filter: string
): [PbPageBlock[], PbBlockCategory[]] => {
    const filterBlocksData = useCallback(
        ({ name }: PbPageBlock) => {
            return name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const filteredBlocksData: PbPageBlock[] =
        filter === "" ? pageBlocksData : pageBlocksData.filter(filterBlocksData);

    const filterBlockCategoriesData = useCallback(
        ({ slug }: PbBlockCategory) => {
            return (
                filteredBlocksData.filter(pageBlock => pageBlock.blockCategory === slug).length > 0
            );
        },
        [filteredBlocksData]
    );

    const filteredBlockCategoriesData: PbBlockCategory[] =
        filter === "" ? blockCategoriesData : blockCategoriesData.filter(filterBlockCategoriesData);

    const sortData = useCallback(
        (categories: PbBlockCategory[]) => {
            if (!sort) {
                return categories;
            }
            const [field, order] = sort.split("_");
            return orderBy(categories, field, order.toLowerCase() as "asc" | "desc");
        },
        [sort]
    );

    return [filteredBlocksData, sortData(filteredBlockCategoriesData)];
};

export default useFilteredCategoriesListData;
