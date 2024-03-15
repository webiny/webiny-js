import React, { useCallback, useMemo, useState } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery } from "@apollo/react-hooks";
import isEmpty from "lodash/isEmpty";

import {
    DataList,
    DataListModalOverlay,
    DataListModalOverlayAction,
    List,
    ListItem,
    ListItemGraphic,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary,
    ScrollList
} from "@webiny/ui/List";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { Typography } from "@webiny/ui/Typography";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { ButtonDefault, ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as DownloadFileIcon } from "@webiny/app-admin/assets/icons/file_download.svg";
import { ReactComponent as UploadFileIcon } from "@webiny/app-admin/assets/icons/file_upload.svg";
import { Icon } from "~/admin/utils/createBlockCategoryPlugin";
import { OptionsMenu } from "~/admin/components/OptionsMenu";

import { PbBlockCategory } from "~/types";
import { LIST_PAGE_CATEGORIES } from "./graphql";
import useImportBlock from "~/admin/views/PageBlocks/hooks/useImportBlock";
import useExportBlockDialog from "~/editor/plugins/defaultBar/components/ExportBlockButton/useExportBlockDialog";
import useFilteredCategoriesListData from "./hooks/useFilteredCategoriesListData";
import { usePageBlocks } from "~/admin/contexts/AdminPageBuilder/PageBlocks/usePageBlocks";

const t = i18n.ns("app-page-builder/admin/page-blocks/by-categories-data-list");

const narrowDialog = css`
    .mdc-dialog__surface {
        width: 400px;
        min-width: 400px;
    }
`;

const noRecordsWrapper = css`
    display: flex;
    justify-content: center;
    color: var(--mdc-theme-on-surface);
`;

const DataListActionsWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
`;

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
    filter: string;
    setFilter: React.Dispatch<React.SetStateAction<string>>;
    canCreate: boolean;
};
const BlocksByCategoriesDataList = ({
    filter,
    setFilter,
    canCreate
}: PageBuilderBlocksByCategoriesDataListProps) => {
    const [sort, setSort] = useState<string>(SORTERS[2].sort);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_PAGE_CATEGORIES);
    const { showExportBlockInitializeDialog } = useExportBlockDialog();

    const blockCategoriesData: PbBlockCategory[] =
        listQuery?.data?.pageBuilder?.listBlockCategories?.data || [];

    const { loading: pageBlocksLoading, pageBlocks, createBlock } = usePageBlocks();

    const [filteredBlocksList, filteredBlockCategoriesList] = useFilteredCategoriesListData(
        pageBlocks,
        blockCategoriesData,
        sort,
        filter
    );

    const selectedBlocksCategory = new URLSearchParams(location.search).get("category");
    const loading = listQuery.loading || pageBlocksLoading;

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

    const onCreatePageBlock = async (categorySlug: string) => {
        try {
            const newBlock = await createBlock({ name: "New block", category: categorySlug });
            setIsDialogOpen(false);
            history.push(`/page-builder/block-editor/${newBlock.id}`);
        } catch (error) {
            showSnackbar(error.message);
        }
    };

    const { showImportDialog } = useImportBlock();

    const handleExportClick = useCallback((selectedBlocksCategory?: string | null) => {
        showExportBlockInitializeDialog({ where: { blockCategory: selectedBlocksCategory } });
    }, []);

    const handleNewBlockClick = useCallback(() => {
        if (selectedBlocksCategory) {
            onCreatePageBlock(selectedBlocksCategory);
        } else {
            setIsDialogOpen(true);
        }
    }, [selectedBlocksCategory]);

    return (
        <>
            <DataList
                title={t`Blocks`}
                loading={Boolean(loading)}
                data={filteredBlockCategoriesList}
                actions={
                    <DataListActionsWrapper>
                        {canCreate ? (
                            <ButtonSecondary
                                onClick={handleNewBlockClick}
                                data-testid={"pb-blocks-list-new-block-btn"}
                            >
                                <ButtonIcon icon={<AddIcon />} /> {t`New Block`}
                            </ButtonSecondary>
                        ) : null}
                        <OptionsMenu
                            data-testid="pb-blocks-list-options-menu"
                            items={[
                                {
                                    label: "Import blocks",
                                    icon: <UploadFileIcon />,
                                    onClick: showImportDialog
                                },
                                {
                                    label: "Export all blocks",
                                    icon: <DownloadFileIcon />,
                                    onClick: () => handleExportClick()
                                },
                                {
                                    label: "Export blocks from current category",
                                    icon: <DownloadFileIcon />,
                                    onClick: () => handleExportClick(selectedBlocksCategory),
                                    disabled: !selectedBlocksCategory
                                }
                            ]}
                        />
                    </DataListActionsWrapper>
                }
                search={
                    <SearchUI
                        value={filter}
                        onChange={setFilter}
                        inputPlaceholder={t`Search blocks`}
                    />
                }
                showOptions={{ refresh: false }}
                modalOverlay={blockCategoriesDataListModalOverlay}
                modalOverlayAction={
                    <DataListModalOverlayAction
                        icon={<FilterIcon />}
                        data-testid={"default-data-list.filter"}
                    />
                }
            >
                {({ data }: { data: PbBlockCategory[] }) => (
                    <ScrollList data-testid="default-data-list">
                        {data.map(item => {
                            const numberOfBlocks = filteredBlocksList.filter(
                                pageBlock => pageBlock.blockCategory === item.slug
                            ).length;
                            return (
                                <ListItem
                                    key={item.slug}
                                    selected={item.slug === selectedBlocksCategory}
                                    onClick={() =>
                                        history.push(
                                            `/page-builder/page-blocks?category=${item.slug}`
                                        )
                                    }
                                >
                                    <ListItemGraphic>
                                        <Icon category={item} />
                                    </ListItemGraphic>
                                    <ListItemText>
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
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                className={narrowDialog}
            >
                <DialogTitle>
                    <Typography use="headline5" tag={"span"}>
                        Please select a block category
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <React.Fragment>
                        {isEmpty(blockCategoriesData) ? (
                            <div className={noRecordsWrapper}>
                                <Typography use="overline">
                                    There are no block categories
                                </Typography>
                            </div>
                        ) : (
                            <List twoLine>
                                {blockCategoriesData.map(item => (
                                    <ListItem
                                        key={item.slug}
                                        onClick={() => onCreatePageBlock(item.slug)}
                                    >
                                        <ListItemGraphic>
                                            <Icon category={item} />
                                        </ListItemGraphic>
                                        <ListItemText>
                                            <ListItemTextPrimary>{item.name}</ListItemTextPrimary>
                                            <ListItemTextSecondary>
                                                {item.slug}
                                            </ListItemTextSecondary>
                                        </ListItemText>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </React.Fragment>
                </DialogContent>
                <DialogActions>
                    <ButtonDefault
                        data-testid={"pb-blocks-list-new-block-category-btn"}
                        onClick={() => history.push("/page-builder/block-categories?new=true")}
                    >
                        + Create a new block category
                    </ButtonDefault>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default BlocksByCategoriesDataList;
