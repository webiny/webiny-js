import React, { useCallback, useMemo, useState } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery, useApolloClient } from "@apollo/react-hooks";
import isEmpty from "lodash/isEmpty";
import get from "lodash/get";

import {
    DataList,
    DataListModalOverlay,
    DataListModalOverlayAction,
    ScrollList,
    List,
    ListItem,
    ListItemGraphic,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { Typography } from "@webiny/ui/Typography";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@webiny/ui/Dialog";
import { ButtonDefault, ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as DownloadFileIcon } from "~/editor/plugins/defaultBar/components/icons/file_download.svg";
import { ReactComponent as UploadFileIcon } from "~/editor/plugins/defaultBar/components/icons/file_upload.svg";
import { Icon } from "~/admin/utils/createBlockCategoryPlugin";
import { OptionsMenu } from "~/admin/components/OptionsMenu";

import { PbBlockCategory, PbPageBlock } from "~/types";
import { LIST_PAGE_BLOCKS_AND_CATEGORIES, LIST_PAGE_BLOCKS, CREATE_PAGE_BLOCK } from "./graphql";

import { addElementId } from "~/editor/helpers";
import useImportBlock from "~/admin/views/PageBlocks/hooks/useImportBlock";
import useExportBlockDialog from "~/editor/plugins/defaultBar/components/ExportBlockButton/useExportBlockDialog";
import useFilteredCategoriesListData from "./hooks/useFilteredCategoriesListData";

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

enum Operation {
    CREATE = "create",
    IMPORT = "import"
}

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
    const [operation, setOperation] = useState<string>(Operation.CREATE);
    const [sort, setSort] = useState<string>(SORTERS[0].sort);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const { history } = useRouter();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_PAGE_BLOCKS_AND_CATEGORIES);
    const { showExportBlockInitializeDialog } = useExportBlockDialog();

    const blockCategoriesData: PbBlockCategory[] =
        listQuery?.data?.pageBuilder?.listBlockCategories?.data || [];
    const pageBlocksData: PbPageBlock[] = listQuery?.data?.pageBuilder?.listPageBlocks?.data || [];

    const [filteredBlocksList, filteredBlockCategoriesList] = useFilteredCategoriesListData(
        pageBlocksData,
        blockCategoriesData,
        sort,
        filter
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

    const onCreatePageBlock = async (categorySlug: string) => {
        const { data: res } = await client.mutate({
            mutation: CREATE_PAGE_BLOCK,
            variables: {
                data: {
                    name: "New block",
                    blockCategory: categorySlug,
                    // Create base block content, and make sure all elements have an `id` property.
                    content: addElementId({
                        type: "block",
                        data: {
                            settings: {
                                width: {
                                    desktop: {
                                        value: "100%"
                                    }
                                },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "10px"
                                    }
                                },
                                horizontalAlignFlex: {
                                    desktop: "center"
                                },
                                verticalAlign: {
                                    desktop: "flex-start"
                                }
                            }
                        },
                        elements: [
                            {
                                id: "nbLftfYqrg",
                                type: "grid",
                                data: {
                                    settings: {
                                        width: {
                                            desktop: {
                                                value: "1100px"
                                            }
                                        },
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: {
                                            desktop: {
                                                all: "10px"
                                            }
                                        },
                                        grid: {
                                            cellsType: "12"
                                        },
                                        gridSettings: {
                                            desktop: {
                                                flexDirection: "row"
                                            },
                                            "mobile-landscape": {
                                                flexDirection: "column"
                                            }
                                        },
                                        horizontalAlignFlex: {
                                            desktop: "flex-start"
                                        },
                                        verticalAlign: {
                                            desktop: "flex-start"
                                        }
                                    }
                                },
                                elements: [
                                    {
                                        id: "FoKq0fZfr4",
                                        type: "cell",
                                        data: {
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px"
                                                    }
                                                },
                                                grid: {
                                                    size: 12
                                                }
                                            }
                                        },
                                        elements: [],
                                        path: ["sUK8viY2oz", "eM2Z1d9gfH", "nbLftfYqrg"]
                                    }
                                ],
                                path: ["sUK8viY2oz", "eM2Z1d9gfH"]
                            }
                        ]
                    }),
                    preview: {}
                }
            },
            refetchQueries: [
                { query: LIST_PAGE_BLOCKS_AND_CATEGORIES },
                { query: LIST_PAGE_BLOCKS }
            ]
        });
        const { error, data } = get(res, `pageBuilder.pageBlock`);
        if (data) {
            setIsDialogOpen(false);
            history.push(`/page-builder/block-editor/${data.id}`);
        } else {
            showSnackbar(error.message);
        }
    };

    const { showImportDialog } = useImportBlock();

    const handleImportClick = useCallback(() => {
        setOperation(Operation.IMPORT);
        setIsDialogOpen(true);
    }, []);

    const handleExportClick = useCallback(() => {
        showExportBlockInitializeDialog();
    }, []);

    const handleNewBlockClick = useCallback(() => {
        if (selectedBlocksCategory) {
            onCreatePageBlock(selectedBlocksCategory);
        } else {
            setOperation(Operation.CREATE);
            setIsDialogOpen(true);
        }
    }, [selectedBlocksCategory]);

    const onSelect = useCallback(
        (slug: string) => {
            if (operation === Operation.CREATE) {
                onCreatePageBlock(slug);
            } else {
                showImportDialog({ slug });
                setIsDialogOpen(false);
            }
        },
        [operation]
    );

    return (
        <>
            <DataList
                title={t`Blocks`}
                loading={Boolean(loading)}
                data={filteredBlockCategoriesList}
                actions={
                    <DataListActionsWrapper>
                        {canCreate ? (
                            <ButtonSecondary onClick={handleNewBlockClick}>
                                <ButtonIcon icon={<AddIcon />} /> {t`New Block`}
                            </ButtonSecondary>
                        ) : null}
                        <OptionsMenu
                            data-testid="pb-blocks-list-options-menu"
                            items={[
                                {
                                    label: "Import blocks",
                                    icon: <UploadFileIcon />,
                                    onClick: handleImportClick
                                },
                                {
                                    label: "Export blocks",
                                    icon: <DownloadFileIcon />,
                                    onClick: handleExportClick
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
                    <Typography use="headline5">Please select a block category</Typography>
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
                                    <ListItem key={item.slug} onClick={() => onSelect(item.slug)}>
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
