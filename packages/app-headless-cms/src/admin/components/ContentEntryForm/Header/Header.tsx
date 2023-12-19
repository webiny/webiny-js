import React from "react";
import { css } from "emotion";
import { Buttons } from "@webiny/app-admin";
import { Grid, Cell } from "@webiny/ui/Grid";
import classNames from "classnames";

import { useContentEntryEditorConfig } from "~/admin/config/contentEntries";

import { ContentFormOptionsMenu } from "./ContentFormOptionsMenu";
import { RevisionSelector } from "~/admin/components/ContentEntryForm/Header/RevisionSelector";

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

export const Header = () => {
    const { buttonActions } = useContentEntryEditorConfig();

    return (
        <React.Fragment>
            <Grid className={toolbarGrid}>
                <Cell span={4} className={classNames(headerActions, headerActionsRight)}>
                    <RevisionSelector />
                </Cell>
                <Cell span={8} className={classNames(headerActions, headerActionsLeft)}>
                    <Buttons actions={buttonActions} />
                    <ContentFormOptionsMenu />
                </Cell>
            </Grid>
        </React.Fragment>
    );
};
