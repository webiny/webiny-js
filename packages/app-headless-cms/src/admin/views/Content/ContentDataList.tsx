import React from "react";
import { upperFirst } from "lodash";
import { css } from "emotion";
import TimeAgo from "timeago-react";
import pluralize from "pluralize";
import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta
} from "@webiny/ui/List";

const t = i18n.ns("app-headless-cms/admin/contents/data-list");

const rightAlign = css({
    alignItems: "flex-end !important",
    justifyContent: "center !important"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

const ContentDataList = ({ contentModel, dataList }) => {
    return (
        <DataList {...dataList} title={pluralize(contentModel.name)}>
            {({ data, isSelected, select }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem
                            key={item.id}
                            className={listItemMinHeight}
                            selected={isSelected(item)}
                        >
                            <ListItemText onClick={() => select(item)}>
                                {item.meta.title || "Untitled"}
                                <ListItemTextSecondary>
                                    {t`Last modified: {time}.`({
                                        time: <TimeAgo datetime={item.savedOn} />
                                    })}
                                </ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta className={rightAlign}>
                                <Typography use={"subtitle2"}>
                                    {upperFirst(item.meta.status)} (v{item.meta.version})
                                </Typography>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </List>
            )}
        </DataList>
    );
};

export default ContentDataList;
