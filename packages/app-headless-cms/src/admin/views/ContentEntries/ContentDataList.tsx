import React, { useMemo } from "react";
import get from "lodash/get";
import upperFirst from "lodash/upperFirst";
import { css } from "emotion";
import TimeAgo from "timeago-react";
import pluralize from "pluralize";
import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";
import * as UIList from "@webiny/ui/List";
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

const ContentDataList = ({ contentModel }) => {
    const { history } = useRouter();

    // Get entry ID and search query (if any)
    const query = new URLSearchParams(location.search);
    const entryId = query.get("id");
    const searchQuery = query.get("search");

    // let variables = {};
    if (searchQuery) {
        // We use the title field with the "contains" operator for doing basic searches.
        // const searchField = contentModel.titleFieldId + "_contains";
        // variables = { where: { [searchField]: searchQuery } };
    }

    // Generate a query based on current content model
    const LIST_QUERY = useMemo(() => createListQuery(contentModel), [contentModel.modelId]);
    const { data, loading, refetch } = useQuery(LIST_QUERY);

    const entries = get(data, "content.data", []);

    return (
        <UIList.DataList
            loading={loading}
            data={entries}
            title={pluralize(contentModel.name)}
            refresh={refetch}
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
                                onClick={() =>
                                    history.push(
                                        `/cms/content-entries/${contentModel.modelId}?id=${item.id}`
                                    )
                                }
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
