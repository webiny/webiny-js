// @flow
import * as React from "react";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";

const SocialSettings = ({ Bind }) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"title"}>
                        <DelayedOnChange>
                            <Input label="Description" description="SEO description" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default SocialSettings;
