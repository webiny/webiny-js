// @flow
import * as React from "react";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { Grid, Cell } from "webiny-ui/Grid";
import { Tags } from "webiny-ui/Tags";
import { Input } from "webiny-ui/Input";

const GeneralSettings = ({ Bind }) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.tags"}>
                        <Tags label="Filter by tags" description="Enter tags to filter pages" />
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default GeneralSettings;
