// @flow
import React from "react";
import { css } from "emotion";
import { renderPlugins } from "webiny-app/plugins";
import { type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";

const headerTitle = css({
    "&.mdc-layout-grid": {
        borderBottom: "1px solid var(--mdc-theme-on-background)",
        color: "var(--mdc-theme-text-primary-on-background)",
        background: "var(--mdc-theme-surface)",
        paddingTop: 10,
        paddingBottom: 9,
        ".mdc-layout-grid__inner": {
            alignItems: "center"
        }
    }
});

const headerActions = css({
    "&.mdc-layout-grid": {
        borderBottom: "1px solid var(--mdc-theme-on-background)",
        height: 50,
        padding: "3px 5px 0 25px",
        background: "var(--mdc-theme-surface)",
        ".right": {
            textAlign: "right"
        }
    }
});

const pageVersion = css({
    color: "var(--mdc-theme-text-secondary-on-background)"
});

type Props = WithPageDetailsProps;

const PageActions = ({ pageDetails, pageDetails: { page } }: Props) => {
    return (
        <React.Fragment>
            <Grid className={headerTitle}>
                <Cell span={12}>
                    <Typography use="headline5">
                        {page.title}{" "}
                        <span className={pageVersion}>
                            (v
                            {page.version})
                        </span>
                    </Typography>
                    <br />
                </Cell>
            </Grid>
            <Grid className={headerActions}>
                <Cell span={6}>
                    {renderPlugins("cms-page-details-header-left", { pageDetails })}
                </Cell>
                <Cell span={6} className={"right"}>
                    {renderPlugins("cms-page-details-header-right", { pageDetails })}
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default PageActions;
