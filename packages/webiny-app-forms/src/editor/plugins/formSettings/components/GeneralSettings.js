// @flow
import * as React from "react";
import { compose } from "recompose";
import { withPageBuilder } from "webiny-app-page-builder/context";
import { Grid, Cell } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";
import { get } from "lodash";
import { I18NInput } from "webiny-app-i18n/admin/components";

const GeneralSettings = ({ Bind, pageBuilder }) => {
    const layouts = get(pageBuilder, "theme.forms.layouts") || [];
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

export default compose(withPageBuilder())(GeneralSettings);
