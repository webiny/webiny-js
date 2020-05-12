import React from "react";
import { css } from "emotion";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { Elevation } from "@webiny/ui/Elevation";
import {
    List,
    ListItem,
    ListItemGraphic,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { ReactComponent as DoneIcon } from "@webiny/app-headless-cms/admin/icons/done-24px.svg";

const formPreviewWrapper = css({
    padding: 40,
    backgroundColor: "var(--webiny-theme-color-surface, #fff) !important",
    margin: 40,
    boxSizing: "border-box"
});

const listWrapper = css({
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",
    ".mdc-list .mdc-list-item": {
        borderBottom: "1px solid var(--mdc-theme-on-background)"
    },
    ".mdc-list .mdc-list-item:last-child": {
        borderBottom: "none"
    }
});

export const IndexesTab = () => {
    const { data } = useContentModelEditor();

    const indexes = [
        { id: 1, fields: ["title"], status: "active" },
        { id: 2, fields: ["price"], status: "active" },
        { id: 3, fields: ["title", "price"], status: "pending" }
    ];
    return (
        <Elevation z={1} className={formPreviewWrapper}>
            <div className={listWrapper}>
                <List twoLine>
                    {indexes.map(item => {
                        return (
                            <ListItem key={item.id}>
                                <ListItemText>
                                    <ListItemTextPrimary>
                                        {item.fields.join(", ")}
                                    </ListItemTextPrimary>
                                    <ListItemTextSecondary>
                                        Status: {item.status}
                                    </ListItemTextSecondary>
                                </ListItemText>
                            </ListItem>
                        );
                    })}
                </List>
            </div>
        </Elevation>
    );
};
