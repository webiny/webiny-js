// @flow
import * as React from "react";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { Grid, Cell } from "webiny-ui/Grid";
import { Tags } from "webiny-ui/Tags";
import { Input } from "webiny-ui/Input";

const GeneralSettings = ({ Bind }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"title"}>
                        <DelayedOnChange>
                            <Input label="Title" description="Page title" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"settings.description"}>
                        <DelayedOnChange>
                            <Input rows={4} label="Description" description="Page description" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"settings.tags"}>
                        <Tags label="Tags" description="Enter tags to filter pages" />
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default GeneralSettings;
