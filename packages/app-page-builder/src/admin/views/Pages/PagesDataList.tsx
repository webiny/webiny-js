import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { useRouter } from "@webiny/react-router";
import { useQuery } from "@apollo/react-hooks";
import debounce from "lodash/debounce";
import get from "lodash/get";
import { LIST_PAGES } from "../../graphql/pages";
import TimeAgo from "timeago-react";
import {
    DataList,
    DataListModalOverlay,
    DataListModalOverlayAction,
    ListItem,
    ListItemMeta,
    ListItemText,
    ListItemTextSecondary,
    ListTextOverline
} from "@webiny/ui/List";
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
const SORTERS = [
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

type PagesDataListProps = {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    canCreate: boolean;
};
const PagesDataList = ({ onCreatePage, canCreate }: PagesDataListProps) => {
    const [filter, setFilter] = useState("");
    const { history, location } = useRouter();
    const query = new URLSearchParams(location.search);

    const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
    const [where, setWhere] = useState({});
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
    const categoriesData = get(categoriesQuery, "data.pageBuilder.listCategories.data", []);

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
                        updateQuery: (prev, { fetchMoreResult }) => {
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
                    data={{ ...where, sort: [sort] }}
                    onChange={({ status, category, sort }) => {
                        // Update "where" filter.
                        const where = { category, status: undefined };
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
                                <Bind name={"status"}>
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

    return (
        <DataList
            title={t`Pages`}
            loading={Boolean(loading)}
            actions={
                canCreate ? (
                    <ButtonSecondary data-testid="new-record-button" onClick={onCreatePage}>
                        <ButtonIcon icon={<AddIcon />} /> {t`New Page`}
                    </ButtonSecondary>
                ) : null
            }
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
        >
            {({ data }) => (
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
                                    <ListItemText
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
