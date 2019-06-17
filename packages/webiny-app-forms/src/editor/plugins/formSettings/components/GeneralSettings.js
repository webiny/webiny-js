// @flow
import * as React from "react";
import { compose } from "recompose";
import { withCms } from "webiny-app-cms/context";
import { Grid, Cell } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";
import { Input } from "webiny-ui/Input";
import { get } from "lodash";

const GeneralSettings = ({ Bind, cms }: Object) => {
    const layouts = get(cms, "theme.forms.layouts") || [];

    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"successMessage"}>
                        <Input label={"Success message"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"submitButtonLabel"}>
                        <Input label={"Submit button label"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"layout.renderer"}>
                        <Select
                            label={"Layout"}
                            options={layouts.map(item => {
                                return { value: item.name, label: item.title };
                            })}
                        />
                    </Bind>
                </Cell>

            </Grid>
        </React.Fragment>
    );
};

export default compose(withCms())(GeneralSettings);
