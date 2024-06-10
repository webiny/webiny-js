import React from "react";
import { Bind } from "@webiny/form";
import { Cell } from "@webiny/ui/Grid";
import { Switch } from "@webiny/ui/Switch";
import {
    CmsModelField,
    CmsModelFieldRendererSettingsProps
} from "@webiny/app-headless-cms-common/types";

export interface IAccordionRenderSettings {
    open: boolean;
}

const DEFAULT_ACCORDION_RENDER_SETTINGS: IAccordionRenderSettings = {
    open: false
};

export const getAccordionRenderSettings = (field: CmsModelField) => {
    if (typeof field.renderer === "function") {
        return DEFAULT_ACCORDION_RENDER_SETTINGS;
    }

    return field.renderer.settings as IAccordionRenderSettings;
};

export const AccordionRenderSettings = ({ field }: CmsModelFieldRendererSettingsProps) => {
    return (
        <>
            <Cell span={12}>
                <Bind name={"renderer.settings.open"} defaultValue={false}>
                    <Switch
                        label={"Expand Accordion"}
                        description={`Enable if "${field.label}" is to be expanded by default.`}
                    />
                </Bind>
            </Cell>
        </>
    );
};
