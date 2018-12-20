// @flow
import * as React from "react";
import { pure } from "recompose";
import { Cell, Grid } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";
import { Switch } from "webiny-ui/Switch";
import { Footer } from "webiny-app-cms/editor/plugins/elementSettings/components/StyledComponents";

export default pure(({ advanced, toggleAdvanced }) => (
    <Footer>
        <Grid className={"no-bottom-padding"}>
            <Cell span={8}>
                <Typography use={"subtitle2"}>Show advanced options</Typography>
            </Cell>
            <Cell span={4}>
                <Switch value={advanced} onChange={() => toggleAdvanced(!advanced)} />
            </Cell>
        </Grid>
    </Footer>
));
