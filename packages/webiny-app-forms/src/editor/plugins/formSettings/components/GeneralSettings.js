// @flow
import * as React from "react";
import { compose } from "recompose";
import { withCms } from "webiny-app-cms/context";
import { Grid, Cell } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";
import { get } from "lodash";
import { I18NInput } from "webiny-app-i18n/components";

const GeneralSettings = ({ Bind, cms }: Object) => {
    const layouts = get(cms, "theme.forms.layouts") || [];
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"successMessage"}>
                        <I18NInput richText label={"Success message"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"submitButtonLabel"}>
                        <I18NInput label={"Submit button label"} />
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
