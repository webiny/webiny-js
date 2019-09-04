// @flow
import * as React from "react";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { get } from "lodash";
import { I18NInput } from "@webiny/app-i18n/admin/components";

const GeneralSettings = ({ Bind }) => {
    const { theme } = usePageBuilder();
    const layouts = get(theme, "forms.layouts") || [];
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

export default GeneralSettings;
