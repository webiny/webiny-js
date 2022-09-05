import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery } from "@apollo/react-hooks";
import debounce from "lodash/debounce";
import get from "lodash/get";
import { LIST_PAGES } from "../../graphql/pages";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import {
    DataList,
    DataListModalOverlay,
    DataListModalOverlayAction,
    ListItem,
    ListItemMeta,
    ListItemText,
    ListItemTextSecondary,
    ListTextOverline,
    ListSelectBox
} from "@webiny/ui/List";
import { Checkbox } from "@webiny/ui/Checkbox";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";
import { Form } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { LIST_CATEGORIES } from "./../Categories/graphql";
import { Cell, Grid } from "@webiny/ui/Grid";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import statusesLabels from "../../constants/pageStatusesLabels";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import * as GQLCache from "~/admin/views/Pages/cache";
import { ReactComponent as FileUploadIcon } from "~/editor/plugins/defaultBar/components/icons/file_upload.svg";
import useImportPageDialog from "~/editor/plugins/defaultBar/components/ImportPageButton/useImportPageDialog";
import { useMultiSelect } from "~/admin/views/Pages/hooks/useMultiSelect";
import { ExportPagesButton } from "~/editor/plugins/defaultBar/components/ExportPageButton";
import { PbCategory } from "~/types";

const t = i18n.ns("app-page-builder/admin/pages/data-list");
const rightAlign = css({
    alignItems: "flex-end !important"
});
const InlineLoaderWrapper = styled("div")({
    position: "absolute",
    bottom: 0,
    left: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 40,
    backgroundColor: "var(--mdc-theme-surface)"
});
const Actions = styled("div")({
    display: "flex",
    justifyContent: "flex-end",
    "& button:not(:first-of-type)": {
        marginLeft: 16
    }
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
        label: t`Title A-Z`,
        sort: "title_ASC"
    },
    {
        label: t`Title Z-A`,
        sort: "title_DESC"
    }
];

interface PagesDataListWhereState {
    status?: string;
    category?: string;
}

interface PagesDataListProps {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    canCreate: boolean;
    onImportPage: (event?: React.SyntheticEvent) => void;
}
const PagesDataList: React.FC<PagesDataListProps> = ({ onCreatePage, canCreate, onImportPage }) => {
    const [filter, setFilter] = useState("");
    const { history, location } = useRouter();
    const query = new URLSearchParams(location.search);

    const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
    const [where, setWhere] = useState<PagesDataListWhereState>({});
    const [sort, setSort] = useState<string>(SORTERS[0].sort);
    const search = {
        query: query.get("search") || undefined
    };

    const setSearchParams = useMemo(() => {
        return debounce(({ filter, location }) => {
            const params = new URLSearchParams(location.search);
            if (filter) {
                params.set("search", filter);
            } else {
                params.delete("search");
            }
            // Update search in URL.
            history.push(`${location.pathname}?${params.toString()}`);
        }, 250);
    }, []);
    // Update "search" param whenever filter is changed
    useEffect(() => {
        setSearchParams({
            filter,
            location
        });
    }, [filter]);

    const variables = {
        search,
        sort,
        where
    };

    const listQuery = useQuery(LIST_PAGES, {
        variables
    });

    GQLCache.writePageListVariablesToLocalStorage(variables);

    const listPagesData = get(listQuery, "data.pageBuilder.listPages.data", []);
    const selectedPageId = new URLSearchParams(location.search).get("id");

    const categoriesQuery = useQuery(LIST_CATEGORIES);
    const categoriesData: PbCategory[] = get(
        categoriesQuery,
        "data.pageBuilder.listCategories.data",
        []
    );

    const loading = [listQuery].find(item => item.loading);
    // Load more pages on page list scroll
    const loadMoreOnScroll = useCallback(
        debounce(({ scrollFrame, fetchMore }) => {
            if (scrollFrame.top > 0.9) {
                const meta = get(listQuery, "data.pageBuilder.listPages.meta", {});
                if (meta.cursor) {
                    setFetchMoreLoading(true);
                    fetchMore({
                        variables: { after: meta.cursor },
                        /**
                         * Figure out better types.
                         * @param prev
                         * @param fetchMoreResult
                         */
                        // TODO @ts-refactor
                        updateQuery: (prev: any, { fetchMoreResult }: any) => {
                            if (!fetchMoreResult) {
                                return prev;
                            }

                            const next = { ...fetchMoreResult };

                            next.pageBuilder.listPages.data = [
                                ...prev.pageBuilder.listPages.data,
                                ...fetchMoreResult.pageBuilder.listPages.data
                            ];
                            setFetchMoreLoading(false);
                            return next;
                        }
                    });
                }
            }
        }, 500),
        [listQuery]
    );

    const pagesDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Form
                    data={{ ...where, sort }}
                    onChange={({ status, category, sort }) => {
                        // Update "where" filter.
                        const where: PagesDataListWhereState = { category, status: undefined };
                        if (status !== "all") {
                            where.status = status;
                        }

                        setWhere(where);

                        // Update "sort".
                        if (typeof sort === "string") {
                            setSort(sort);
                        }
                    }}
                >
                    {({ Bind }) => (
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"category"}>
                                    <AutoComplete
                                        description={"Filter by a specific category."}
                                        label={t`Filter by category`}
                                        options={categoriesData.map(item => ({
                                            id: item.slug,
                                            name: item.name
                                        }))}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name={"status"}
                                    defaultValue={"all"}
                                    beforeChange={(value, cb) => {
                                        cb(value === "all" ? undefined : value);
                                    }}
                                >
                                    <Select
                                        label={t`Filter by status`}
                                        description={"Filter by a specific page status."}
                                    >
                                        <option value={"all"}>{t`All`}</option>
                                        <option value={"draft"}>{t`Draft`}</option>
                                        <option value={"published"}>{t`Published`}</option>
                                        <option value={"unpublished"}>{t`Unpublished`}</option>
                                        <option
                                            value={"reviewRequested"}
                                        >{t`Review requested`}</option>
                                        <option
                                            value={"changesRequested"}
                                        >{t`Changes requested`}</option>
                                    </Select>
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name={"sort"}>
                                    <Select label={t`Sort by`} description={"Sort pages by"}>
                                        {SORTERS.map(({ label, sort: value }) => {
                                            return (
                                                <option key={label} value={value}>
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                    )}
                </Form>
            </DataListModalOverlay>
        ),
        [categoriesData, where, sort]
    );

    const { showImportPageDialog } = useImportPageDialog();

    const listActions = useMemo(() => {
        if (!canCreate) {
            return null;
        }
        return (
            <Actions>
                <ButtonSecondary data-testid="import-page-button" onClick={onImportPage}>
                    <ButtonIcon icon={<FileUploadIcon />} /> {t`Import Page`}
                </ButtonSecondary>
                <ButtonSecondary data-testid="new-record-button" onClick={onCreatePage}>
                    <ButtonIcon icon={<AddIcon />} /> {t`New Page`}
                </ButtonSecondary>
            </Actions>
        );
    }, [canCreate, showImportPageDialog]);

    const multiSelectProps = useMultiSelect({
        useRouter: false,
        getValue: (item: any) => item.pid
    });

    return (
        <DataList
            title={t`Pages`}
            loading={Boolean(loading)}
            actions={listActions}
            data={listPagesData}
            search={
                <SearchUI value={filter} onChange={setFilter} inputPlaceholder={t`Search pages`} />
            }
            modalOverlay={pagesDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
            multiSelectActions={
                <ExportPagesButton
                    getMultiSelected={multiSelectProps.getMultiSelected}
                    where={where}
                    sort={sort}
                    search={{
                        query: search ? search.query || "" : ""
                    }}
                />
            }
            multiSelectAll={multiSelectProps.multiSelectAll}
            isAllMultiSelected={multiSelectProps.isAllMultiSelected}
            isNoneMultiSelected={multiSelectProps.isNoneMultiSelected}
            refresh={() => {
                if (!listQuery.refetch) {
                    return;
                }
                listQuery.refetch();
            }}
        >
            {(
                { data }: any // TODO @ts-refactor
            ) => (
                <>
                    <Scrollbar
                        data-testid="default-data-list"
                        onScrollFrame={scrollFrame =>
                            loadMoreOnScroll({ scrollFrame, fetchMore: listQuery.fetchMore })
                        }
                    >
                        {Array.isArray(data) &&
                            data.map(page => (
                                <ListItem key={page.id} selected={page.id === selectedPageId}>
                                    <ListSelectBox>
                                        <Checkbox
                                            onChange={() => multiSelectProps.multiSelect(page)}
                                            value={multiSelectProps.isMultiSelected(page)}
                                        />
                                    </ListSelectBox>
                                    <ListItemText
                                        data-testid={"pages-default-data-list.select-page"}
                                        onClick={() => {
                                            query.set("id", page.id);
                                            history.push({ search: query.toString() });
                                        }}
                                    >
                                        {page.title}
                                        <ListTextOverline>
                                            {page.category?.name || t`Unknown category`}
                                        </ListTextOverline>
                                        {page.createdBy && (
                                            <ListItemTextSecondary>
                                                Created by: {page.createdBy.displayName || "N/A"}.
                                                Last modified: <TimeAgo datetime={page.savedOn} />.
                                            </ListItemTextSecondary>
                                        )}
                                    </ListItemText>
                                    <ListItemMeta className={rightAlign}>
                                        <Typography use={"subtitle2"}>
                                            {`${statusesLabels[page.status]} (v${page.version})`}
                                        </Typography>
                                    </ListItemMeta>
                                </ListItem>
                            ))}
                    </Scrollbar>
                    {fetchMoreLoading && (
                        <InlineLoaderWrapper>
                            <Typography use={"overline"}>{t`Loading more pages...`}</Typography>
                        </InlineLoaderWrapper>
                    )}
                </>
            )}
        </DataList>
    );
};

export default PagesDataList;
