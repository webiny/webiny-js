import React, { useCallback, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useApolloClient } from "@apollo/react-hooks";
import orderBy from "lodash/orderBy";
import get from "lodash/get";

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
import { Typography } from "@webiny/ui/Typography";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { Dialog, DialogTitle } from "@webiny/ui/Dialog";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";

import { PbBlockCategory, PbPageBlock } from "~/types";
import { LIST_PAGE_BLOCKS_AND_CATEGORIES, CREATE_PAGE_BLOCK } from "./graphql";

import preview from "./assets/preview.png";

const t = i18n.ns("app-page-builder/admin/page-blocks/by-categories-data-list");

const CustomScrollList = styled(ScrollList)({
    maxHeight: "425px",
    height: "100%"
});

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

type PageBuilderBlocksByCategoriesDataListProps = {
    canCreate: boolean;
};
const BlocksByCategoriesDataList = ({ canCreate }: PageBuilderBlocksByCategoriesDataListProps) => {
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(SORTERS[0].sort);
    const [isNewPageBlockDialogOpen, setIsNewPageBlockDialogOpen] = useState<boolean>(false);
    const { history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
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

    const onCreatePageBlock = async (categorySlug: string) => {
        const { data: res } = await client.mutate({
            mutation: CREATE_PAGE_BLOCK,
            variables: {
                data: {
                    name: "New block",
                    blockCategory: categorySlug,
                    content: {
                        type: "block",
                        elements: [
                            {
                                type: "grid",
                                data: {
                                    settings: {
                                        grid: {
                                            cellsType: "12"
                                        }
                                    }
                                },
                                elements: [
                                    {
                                        type: "cell",
                                        data: {
                                            settings: {
                                                grid: {
                                                    size: 12
                                                }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    preview: {
                        src: preview
                    }
                }
            }
        });
        const { error, data } = get(res, `pageBuilder.pageBlock`);
        if (data) {
            setIsNewPageBlockDialogOpen(false);
            history.push(`/page-builder/block-editor/${data.id}`);
        } else {
            showSnackbar(error.message);
        }
    };

    return (
        <>
            <DataList
                title={t`Blocks`}
                loading={Boolean(loading)}
                data={categoryList}
                actions={
                    canCreate ? (
                        <ButtonSecondary onClick={() => setIsNewPageBlockDialogOpen(true)}>
                            <ButtonIcon icon={<AddIcon />} /> {t`New Block`}
                        </ButtonSecondary>
                    ) : null
                }
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
            <Dialog
                open={isNewPageBlockDialogOpen}
                onClose={() => setIsNewPageBlockDialogOpen(false)}
            >
                <DialogTitle>
                    <Typography use="headline5">Please select block category</Typography>
                </DialogTitle>
                <CustomScrollList>
                    {categoryList.map(item => (
                        <ListItem key={item.slug} onClick={() => onCreatePageBlock(item.slug)}>
                            <ListItemText>{item.name}</ListItemText>
                        </ListItem>
                    ))}
                </CustomScrollList>
            </Dialog>
        </>
    );
};

export default BlocksByCategoriesDataList;
