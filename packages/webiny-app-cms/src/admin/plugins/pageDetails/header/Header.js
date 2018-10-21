// @flow
import React from "react";
import { css } from "emotion";
import { Plugins } from "webiny-app/components";
import { type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";

const listHeader = css({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)"
});

type Props = WithPageDetailsProps;

const PageActions = ({ pageDetails, pageDetails: { revision } }: Props) => {
    return (
        <Grid className={listHeader}>
            <Cell span={6}>
                <Typography use="headline5">{revision.data.title}</Typography>
            </Cell>
            <Cell span={6}>
                <Plugins type={"cms-page-details-header"} params={{ pageDetails }} />
            </Cell>
        </Grid>
    );
};

export default PageActions;
