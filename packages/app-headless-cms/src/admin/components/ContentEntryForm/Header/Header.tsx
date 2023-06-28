import React, { Fragment } from "react";
import { css } from "emotion";
import { Grid, Cell } from "@webiny/ui/Grid";
import classNames from "classnames";

import { useContentEntryEditorConfig } from "~/admin/config/contentEntries";

import { ContentFormOptionsMenu } from "./ContentFormOptionsMenu";

const toolbarGrid = css({
    borderBottom: "1px solid var(--mdc-theme-on-background)"
});

const headerActions = css({
    display: "flex",
    alignItems: "center"
});

const headerActionsLeft = css({
    justifyContent: "flex-end"
});

const headerActionsRight = css({
    justifyContent: "flex-start"
});

export const Header: React.FC = () => {
    const { form } = useContentEntryEditorConfig();
    return (
        <React.Fragment>
            <Grid className={toolbarGrid}>
                <Cell span={4} className={classNames(headerActions, headerActionsRight)}>
                    {form.actions
                        .filter(action => action.position === "secondary")
                        .map(action => (
                            <Fragment key={action.name}>{action.element}</Fragment>
                        ))}
                </Cell>
                <Cell span={8} className={classNames(headerActions, headerActionsLeft)}>
                    {form.actions
                        .filter(action => action.position === "primary")
                        .map(action => (
                            <Fragment key={action.name}>{action.element}</Fragment>
                        ))}
                    <ContentFormOptionsMenu />
                </Cell>
            </Grid>
        </React.Fragment>
    );
};
