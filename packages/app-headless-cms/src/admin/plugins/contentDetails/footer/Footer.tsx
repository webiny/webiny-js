import React from "react";
import { css } from "emotion";
import { renderPlugins } from "@webiny/app/plugins";
import { Grid, Cell } from "@webiny/ui/Grid";
import classNames from "classnames";

const toolbarGrid = css({
    borderTop: "1px solid var(--mdc-theme-on-background)"
});

const footerActions = css({
    display: "flex",
    alignItems: "center"
});

const footerActionsLeft = css({
    justifyContent: "flex-end"
});

const footerActionsRight = css({
    justifyContent: "flex-start"
});

const Footer = props => {
    return (
        <React.Fragment>
            <Grid className={toolbarGrid}>
                <Cell span={6} className={classNames(footerActions, footerActionsRight)}>
                    {renderPlugins("cms-content-details-footer-left", props)}
                </Cell>
                <Cell span={6} className={classNames(footerActions, footerActionsLeft)}>
                    {renderPlugins("cms-content-details-footer-right", props)}
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default Footer;
