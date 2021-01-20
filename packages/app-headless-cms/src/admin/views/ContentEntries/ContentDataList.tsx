import React, { useEffect, useMemo, useState } from "react";
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
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
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

type ContentDataListProps = {
    contentModel: any;
    canCreate: boolean;
};
const ContentDataList = ({ contentModel, canCreate }: ContentDataListProps) => {
    const [filter, setFilter] = useState("");
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

    // Generate a query based on current content model
    const LIST_QUERY = useMemo(() => createListQuery(contentModel), [contentModel.modelId]);
    const { data, loading } = useQuery(LIST_QUERY, { variables });

    const entries = get(data, "content.data", []);

    return (
        <UIList.DataList
            loading={loading}
            data={entries}
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
