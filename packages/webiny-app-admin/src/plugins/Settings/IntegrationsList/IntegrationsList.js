// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";

const IntegrationsList = () => {
    return (
        <>
            <Grid>
                <Cell span={12}>Integration 1</Cell>
            </Grid>
            <Grid>
                <Cell span={12}>Integration 2</Cell>
            </Grid>
            <Grid>
                <Cell span={12}>Integration 3</Cell>
            </Grid>
        </>
    );
};

export default IntegrationsList;
