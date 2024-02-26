import React, { useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import get from "lodash/get";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { plugins } from "@webiny/plugins";
import { FbFormLayoutPlugin } from "~/types";
import { PbTheme, PbThemePlugin } from "@webiny/app-page-builder/types";
import { RichTextEditor, createPropsFromConfig } from "@webiny/app-admin/components/RichTextEditor";
import { BindComponent } from "@webiny/form";

type LayoutListItem = FbFormLayoutPlugin["layout"];
interface GeneralSettingsProps {
    Bind: BindComponent;
}
const GeneralSettings = ({ Bind }: GeneralSettingsProps) => {
    const theme = useMemo(
        (): PbTheme =>
            Object.assign({}, ...plugins.byType<PbThemePlugin>("pb-theme").map(pl => pl.theme)),
        []
    );

    const layouts = useMemo((): LayoutListItem[] => {
        const layoutsList: LayoutListItem[] = [
            ...(get(theme, "formBuilder.layouts") || []),
            ...plugins.byType<FbFormLayoutPlugin>("form-layout").map(pl => pl.layout)
        ];

        return layoutsList.reduce((acc, item) => {
            if (!acc.find(layout => layout.name === item.name)) {
                acc.push(item);
            }
            return acc;
        }, [] as LayoutListItem[]);
    }, []);

    const rteProps = useMemo(() => {
        return createPropsFromConfig(plugins.byType("fb-rte-config").map(pl => pl.config));
    }, []);

    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"successMessage"}>
                        <RichTextEditor {...rteProps} label={"Success message"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"submitButtonLabel"}>
                        <Input label={"Submit button label"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"fullWidthSubmitButton"}>
                        <Switch
                            label={"Full width submit button"}
                            description={
                                "Should the submit button be fully stretched or should it match the submit label size."
                            }
                        />
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
