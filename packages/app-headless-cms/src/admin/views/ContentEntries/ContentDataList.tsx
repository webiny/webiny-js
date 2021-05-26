import React, { useCallback, useEffect, useMemo, useState } from "react";
import get from "lodash/get";
import debounce from "lodash/debounce";
import set from "lodash/set";
import unset from "lodash/unset";
import cloneDeep from "lodash/cloneDeep";
import { css } from "emotion";
import TimeAgo from "timeago-react";
import pluralize from "pluralize";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";
import * as UIList from "@webiny/ui/List";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { useQuery } from "../../hooks";
import { useRouter } from "@webiny/react-router";
import { Form } from "@webiny/form";
import { createListQuery } from "../components/ContentModelForm/graphql";
import statusLabels from "../../constants/statusLabels";

const t = i18n.ns("app-headless-cms/admin/contents/data-list");

const rightAlign = css({
    alignItems: "flex-end !important",
    justifyContent: "center !important"
});

const ModelId = styled("span")({
    color: "var(--mdc-theme-text-secondary-on-background)"
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

const listItemMinHeight = css({
    minHeight: "66px !important"
});

type Sorter = { label: string; value: string };

type ContentDataListProps = {
    contentModel: any;
    canCreate: boolean;
    listQueryVariables: any;
    setListQueryVariables: (prevState?: any) => void;
    sorters: Sorter[];
};

const ContentDataList = ({
    contentModel,
    canCreate,
    listQueryVariables,
    setListQueryVariables,
    sorters
}: ContentDataListProps) => {
    const [fetchMoreLoading, setFetchMoreLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const [formData, setFormData] = useState(listQueryVariables);
    const { history } = useRouter();
    const baseUrl = `/cms/content-entries/${contentModel.modelId}`;

    // Get entry ID and search query (if any)
    const query = new URLSearchParams(location.search);
    const entryId = query.get("id");
    const searchQuery = query.get("search");
    const updateSearch = useCallback(
        debounce(({ filter, query }) => {
            const search = query.get("search");
            if (typeof search !== "string" && !filter) {
                return;
            }
            if (filter !== search) {
                query.set("search", filter);
                // We use the title field with the "contains" operator for doing basic searches.
                const searchField = contentModel.titleFieldId + "_contains";
                setListQueryVariables(prev => {
                    const next = cloneDeep(prev);
                    if (filter) {
                        set(next, `where.${searchField}`, filter);
                    } else {
                        unset(next, `where.${searchField}`);
                    }

                    return next;
                });
                history.push(`${baseUrl}?${query.toString()}`);
            }
        }, 250),
        [baseUrl]
    );

    // Set "filter" from search "query" on page load.
    useEffect(() => {
        if (searchQuery) {
            setFilter(searchQuery);
        }
    }, [baseUrl]);

    useEffect(() => updateSearch({ filter, query }), [baseUrl, filter]);

    // Generate a query based on current content model
    const LIST_QUERY = useMemo(() => createListQuery(contentModel), [contentModel.modelId]);
    const { data, loading, fetchMore } = useQuery(LIST_QUERY, { variables: listQueryVariables });

    const entriesDataListModalOverlay = useMemo(
        () => (
            <UIList.DataListModalOverlay>
                <Form
                    data={formData}
                    onChange={({ status, sort }) => {
                        setFormData({ status, sort });
                        setListQueryVariables(prevState => ({ ...prevState, sort }));
                    }}
                >
                    {({ Bind }) => (
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"sort"}>
                                    <Select label={t`Sort by`}>
                                        {sorters.map(({ label, value }) => {
                                            return (
                                                <option key={label} value={value}>
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </Select>
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
                        </Grid>
                    )}
                </Form>
            </UIList.DataListModalOverlay>
        ),
        [formData]
    );

    const onCreate = useCallback(() => {
        history.push(`/cms/content-entries/${contentModel.modelId}?new=true`);
    }, [contentModel]);

    const filterByStatus = useCallback((entries, status) => {
        if (!status || status === "all") {
            return entries;
        }
        return entries.filter(item => item.meta.status === status);
    }, []);

    // Load more entries on scroll
    const loadMoreOnScroll = useCallback(
        debounce(({ scrollFrame, fetchMore }) => {
            if (scrollFrame.top > 0.9) {
                const meta = get(data, "content.meta", {});
                if (meta.hasMoreItems) {
                    setFetchMoreLoading(true);
                    fetchMore({
                        variables: { after: meta.cursor },
                        updateQuery: (prev, { fetchMoreResult }) => {
                            if (!fetchMoreResult) {
                                return prev;
                            }

                            const next = { ...fetchMoreResult };

                            next.content.data = [
                                ...prev.content.data,
                                ...fetchMoreResult.content.data
                            ];
                            setFetchMoreLoading(false);
                            return next;
                        }
                    });
                }
            }
        }, 500),
        [data]
    );

    const entries = get(data, "content.data", []);
    const filteredData = filterByStatus(entries, formData.status);

    return (
        <UIList.DataList
            loading={loading}
            data={filteredData}
            title={
                <span>
                    {pluralize(contentModel.name)}
                    <br />
                    <Typography use={"subtitle1"}>
                        <ModelId>Model ID: {contentModel.modelId}</ModelId>
                    </Typography>
                </span>
            }
            actions={
                canCreate ? (
                    <ButtonSecondary data-testid="new-record-button" onClick={onCreate}>
                        <ButtonIcon icon={<AddIcon />} /> {t`New Entry`}
                    </ButtonSecondary>
                ) : null
            }
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search {title}`({ title: pluralize(contentModel.name) })}
                />
            }
            modalOverlay={entriesDataListModalOverlay}
            modalOverlayAction={
                <UIList.DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
        >
            {({ data }) => (
                <>
                    <Scrollbar
                        data-testid="default-data-list"
                        onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame, fetchMore })}
                    >
                        {data.map(item => (
                            <UIList.ListItem
                                key={item.id}
                                className={listItemMinHeight}
                                selected={item.id === entryId}
                            >
                                <UIList.ListItemText
                                    onClick={() => {
                                        history.push(
                                            `/cms/content-entries/${
                                                contentModel.modelId
                                            }?id=${encodeURIComponent(item.id)}`
                                        );
                                    }}
                                >
                                    {item.meta.title || "Untitled"}
                                    <UIList.ListItemTextSecondary>
                                        {t`Last modified: {time}.`({
                                            time: <TimeAgo datetime={item.savedOn} />
                                        })}
                                    </UIList.ListItemTextSecondary>
                                </UIList.ListItemText>

                                <UIList.ListItemMeta className={rightAlign}>
                                    <Typography use={"subtitle2"}>
                                        {statusLabels[item.meta.status]} (v{item.meta.version})
                                    </Typography>
                                </UIList.ListItemMeta>
                            </UIList.ListItem>
                        ))}
                    </Scrollbar>
                    {fetchMoreLoading && (
                        <InlineLoaderWrapper>
                            <Typography use={"overline"}>{t`Loading more entries...`}</Typography>
                        </InlineLoaderWrapper>
                    )}
                </>
            )}
        </UIList.DataList>
    );
};

export default ContentDataList;
