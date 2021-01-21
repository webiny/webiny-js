import React, { useCallback, useEffect, useMemo, useState } from "react";
import get from "lodash/get";
import upperFirst from "lodash/upperFirst";
import debounce from "lodash/debounce";
import { css } from "emotion";
import TimeAgo from "timeago-react";
import pluralize from "pluralize";
import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";
import * as UIList from "@webiny/ui/List";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { useRouter } from "@webiny/react-router";
import { createListQuery } from "../components/ContentModelForm/graphql";

const t = i18n.ns("app-headless-cms/admin/contents/data-list");

const rightAlign = css({
    alignItems: "flex-end !important",
    justifyContent: "center !important"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

const SORTERS = [
    {
        label: t`Newest to oldest`,
        value: "createdOn_DESC"
    },
    {
        label: t`Oldest to newest`,
        value: "createdOn_ASC"
    }
];

type ContentDataListProps = {
    contentModel: any;
    canCreate: boolean;
};
const ContentDataList = ({ contentModel, canCreate }: ContentDataListProps) => {
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(SORTERS[0].value);
    const [status, setStatus] = useState("all");
    const { history } = useRouter();

    // Get entry ID and search query (if any)
    const query = new URLSearchParams(location.search);
    const entryId = query.get("id");
    const searchQuery = query.get("search");
    const updateSearch = useMemo(
        () =>
            debounce(({ filter, query, baseURL }) => {
                const search = query.get("search");
                if (typeof search !== "string" && !filter) {
                    return;
                }
                if (filter !== search) {
                    query.set("search", filter);
                    history.push(`${baseURL}?${query.toString()}`);
                }
            }, 250),
        []
    );
    // Set "filter" from search "query" on page load.
    useEffect(() => {
        if (!filter && searchQuery) {
            setFilter(searchQuery);
        }
    }, []);

    useEffect(() => {
        const baseURL = `/cms/content-entries/${contentModel.modelId}`;
        updateSearch({ filter, query, baseURL });
    }, [filter, query, contentModel.modelId]);

    let variables = {};
    if (searchQuery) {
        // We use the title field with the "contains" operator for doing basic searches.
        const searchField = contentModel.titleFieldId + "_contains";
        variables = { where: { [searchField]: searchQuery } };
    }
    if (sort) {
        variables["sort"] = sort;
    }

    // Generate a query based on current content model
    const LIST_QUERY = useMemo(() => createListQuery(contentModel), [contentModel.modelId]);
    const { data, loading } = useQuery(LIST_QUERY, { variables });
    // Generate sorters based on current content model
    const sorters = useMemo(() => {
        const titleField = contentModel.fields.find(
            field => field.fieldId === contentModel.titleFieldId
        );
        const titleFieldLabel = titleField ? titleField.label : null;
        if (!titleFieldLabel) {
            return SORTERS;
        }

        return [
            ...SORTERS,
            {
                label: t`{titleFieldLabel} A-Z`({ titleFieldLabel }),
                value: `${contentModel.titleFieldId}_ASC`
            },
            {
                label: t`{titleFieldLabel} Z-A`({ titleFieldLabel }),
                value: `${contentModel.titleFieldId}_DESC`
            }
        ];
    }, [contentModel]);

    const entriesDataListModalOverlay = useMemo(
        () => (
            <UIList.DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select value={sort} onChange={setSort} label={t`Sort by`}>
                            {sorters.map(({ label, value }) => {
                                return (
                                    <option key={label} value={value}>
                                        {label}
                                    </option>
                                );
                            })}
                        </Select>
                    </Cell>
                    <Cell span={12}>
                        <Select
                            value={status}
                            onChange={setStatus}
                            label={t`Filter by status`}
                            description={"Filter by a specific page status."}
                        >
                            <option value={"all"}>{t`All`}</option>
                            <option value={"draft"}>{t`Draft`}</option>
                            <option value={"published"}>{t`Published`}</option>
                            <option value={"unpublished"}>{t`Unpublished`}</option>
                            <option value={"reviewRequested"}>{t`Review requested`}</option>
                            <option value={"changesRequested"}>{t`Changes requested`}</option>
                        </Select>
                    </Cell>
                </Grid>
            </UIList.DataListModalOverlay>
        ),
        [sort, status]
    );

    const filterByStatus = useCallback(
        entries => {
            if (status === "all") {
                return entries;
            }
            return entries.filter(item => item.meta.status === status);
        },
        [status]
    );

    const entries = get(data, "content.data", []);
    const filteredData = filterByStatus(entries);

    return (
        <UIList.DataList
            loading={loading}
            data={filteredData}
            title={pluralize(contentModel.name)}
            actions={
                canCreate ? (
                    <ButtonSecondary
                        data-testid="new-record-button"
                        onClick={() =>
                            history.push(`/cms/content-entries/${contentModel.modelId}?new=true`)
                        }
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`Add Entry`}
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
            modalOverlayAction={<UIList.DataListModalOverlayAction icon={<FilterIcon />} />}
        >
            {({ data }) => (
                <UIList.List data-testid="default-data-list">
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
                                    {upperFirst(item.meta.status)} (v{item.meta.version})
                                </Typography>
                            </UIList.ListItemMeta>
                        </UIList.ListItem>
                    ))}
                </UIList.List>
            )}
        </UIList.DataList>
    );
};

export default ContentDataList;
