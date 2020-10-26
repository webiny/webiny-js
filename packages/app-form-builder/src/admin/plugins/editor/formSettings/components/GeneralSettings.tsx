import React, { useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { get } from "lodash";
import { I18NInput } from "@webiny/app-i18n/admin/components";
import { getPlugins } from "@webiny/plugins";
import { FbFormLayoutPlugin } from "@webiny/app-form-builder/types";
import { PbThemePlugin } from "@webiny/app-page-builder/types";

const GeneralSettings = ({ Bind }) => {
    const theme = useMemo(
        () => Object.assign({}, ...getPlugins("pb-theme").map((pl: PbThemePlugin) => pl.theme)),
        []
    );

    const layouts = useMemo(
        () =>
            [
                ...(get(theme, "forms.layouts") || []),
                ...getPlugins<FbFormLayoutPlugin>("form-layout").map(pl => pl.layout)
            ].reduce((acc, item) => {
                if (!acc.find(l => l.name === item.name)) {
                    acc.push(item);
                }
                return acc;
            }, []),
        []
    );

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
