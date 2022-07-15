import React, { useCallback, useMemo, useState } from "react";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery } from "@apollo/react-hooks";
import orderBy from "lodash/orderBy";

import {
    DataList,
    DataListModalOverlay,
    DataListModalOverlayAction,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";

import { PbBlockCategory, PbPageBlock } from "~/types";
import { LIST_PAGE_BLOCKS_AND_CATEGORIES } from "./graphql";

const t = i18n.ns("app-page-builder/admin/page-blocks/by-categories-data-list");

interface Sorter {
    label: string;
    sort: string;
}
const SORTERS: Sorter[] = [
    {
        label: t`Newest to oldest`,
        sort: "createdOn_DESC"
    },
    {
        label: t`Oldest to newest`,
        sort: "createdOn_ASC"
    },
    {
        label: t`Name A-Z`,
        sort: "name_ASC"
    },
    {
        label: t`Name Z-A`,
        sort: "name_DESC"
    }
];

const BlocksByCategoriesDataList = () => {
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(SORTERS[0].sort);
    const { history } = useRouter();
    const listQuery = useQuery(LIST_PAGE_BLOCKS_AND_CATEGORIES);

    const blockCategoriesData: PbBlockCategory[] =
        listQuery?.data?.pageBuilder?.listBlockCategories?.data || [];
    const pageBlocksData: PbPageBlock[] = listQuery?.data?.pageBuilder?.listPageBlocks?.data || [];

    const filterData = useCallback(
        ({ slug, name }) => {
            return slug.toLowerCase().includes(filter) || name.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortData = useCallback(
        categories => {
            if (!sort) {
                return categories;
            }
            const [field, order] = sort.split("_");
            return orderBy(categories, field, order.toLowerCase() as "asc" | "desc");
        },
        [sort]
    );

    const selectedBlocksCategory = new URLSearchParams(location.search).get("category");
    const loading = [listQuery].find(item => item.loading);

    const blockCategoriesDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            description={"Sort block categories by"}
                        >
                            {SORTERS.map(({ label, sort: value }) => {
                                return (
                                    <option key={label} value={value}>
                                        {label}
                                    </option>
                                );
                            })}
                        </Select>
                    </Cell>
                </Grid>
            </DataListModalOverlay>
        ),
        [sort]
    );

    const filteredBlockCategoriesData: PbBlockCategory[] =
        filter === "" ? blockCategoriesData : blockCategoriesData.filter(filterData);
    const categoryList: PbBlockCategory[] = sortData(filteredBlockCategoriesData);

    return (
        <DataList
            title={t`Blocks`}
            loading={Boolean(loading)}
            data={categoryList}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search categories`}
                />
            }
            modalOverlay={blockCategoriesDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
            refresh={() => {
                if (!listQuery.refetch) {
                    return;
                }
                listQuery.refetch();
            }}
        >
            {({ data }: { data: PbBlockCategory[] }) => (
                <ScrollList data-testid="default-data-list">
                    {data.map(item => {
                        const numberOfBlocks = pageBlocksData.filter(
                            pageBlock => pageBlock.blockCategory === item.slug
                        ).length;
                        return (
                            <ListItem
                                key={item.slug}
                                selected={item.slug === selectedBlocksCategory}
                            >
                                <ListItemText
                                    onClick={() =>
                                        history.push(
                                            `/page-builder/page-blocks?category=${item.slug}`
                                        )
                                    }
                                >
                                    {item.name}
                                    <ListItemTextSecondary>{`${numberOfBlocks} ${
                                        numberOfBlocks === 1 ? "block" : "blocks"
                                    } in the category`}</ListItemTextSecondary>
                                </ListItemText>
                            </ListItem>
                        );
                    })}
                </ScrollList>
            )}
        </DataList>
    );
};

export default BlocksByCategoriesDataList;
