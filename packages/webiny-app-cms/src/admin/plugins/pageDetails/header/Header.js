// @flow
import React from "react";
import { css } from "emotion";
import { renderPlugins } from "webiny-app/plugins";
import { type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";

const listHeader = css({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)"
});

type Props = WithPageDetailsProps;

const PageActions = ({
    pageDetails,
    pageDetails: { page }
}: Props) => {
    return (
        <Grid className={listHeader}>
            <Cell span={6}>
                <Typography use="headline5">{page.title}</Typography>
            </Cell>
            <Cell span={6}>
                {renderPlugins("cms-page-details-header", { pageDetails })}
            </Cell>
        </Grid>
    );
};

export default PageActions;
