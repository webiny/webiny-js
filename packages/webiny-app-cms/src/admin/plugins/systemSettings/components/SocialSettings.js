// @flow
import * as React from "react";
import { compose } from "recompose";
import { withTheme } from "webiny-app-cms/theme";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";

const GeneralSettings = ({ Bind }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"social.facebook"} validators={["url"]}>
                        <DelayedOnChange>
                            <Input label="Facebook" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"social.twitter"} validators={["url"]}>
                        <DelayedOnChange>
                            <Input label="Twitter" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"social.instagram"} validators={["url"]}>
                        <DelayedOnChange>
                            <Input label="Instagram" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default compose(withTheme())(GeneralSettings);
