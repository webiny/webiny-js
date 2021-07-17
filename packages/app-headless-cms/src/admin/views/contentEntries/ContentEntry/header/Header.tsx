import React from "react";
import { css } from "emotion";
import { renderPlugins } from "@webiny/app/plugins";
import { Grid, Cell } from "@webiny/ui/Grid";
import classNames from "classnames";

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

const Header = props => {
    return (
        <React.Fragment>
            <Grid className={toolbarGrid}>
                <Cell span={4} className={classNames(headerActions, headerActionsRight)}>
                    {renderPlugins("cms-content-details-header-left", props)}
                </Cell>
                <Cell span={8} className={classNames(headerActions, headerActionsLeft)}>
                    {renderPlugins("cms-content-details-header-right", props)}
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default Header;
