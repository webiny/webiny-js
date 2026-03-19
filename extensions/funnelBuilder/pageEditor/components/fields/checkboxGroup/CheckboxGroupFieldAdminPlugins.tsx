import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-page-builder";
import { CheckboxGroupFieldRenderer } from "./CheckboxGroupFieldRenderer";
import { ELEMENT_TYPE } from "./constants";
import { CheckboxGroupFieldSettings } from "./CheckboxGroupFieldSettings";
import { PbEditorFunnelFieldSettingsPlugin } from "../../../admin/plugins/PbEditorFunnelFieldSettingsPlugin";
import { PbEditorFunnelFieldPageElementPlugin } from "../../../admin/plugins/PbEditorFunnelFieldPageElementPlugin";
import { ReactComponent as TextIcon } from "@material-design-icons/svg/outlined/check_box.svg";

export const CheckboxGroupFieldAdminPlugins = () => {
    return (
        <>
            <PbRenderElementPlugin
                elementType={ELEMENT_TYPE}
                renderer={CheckboxGroupFieldRenderer}
            />
            <PbEditorFunnelFieldPageElementPlugin
                fieldType={"checkboxGroup"}
                renderer={CheckboxGroupFieldRenderer}
                name={"CheckboxGroup"}
                description={"Choose one or more options"}
                icon={<TextIcon />}
            />

            <PbEditorFunnelFieldSettingsPlugin
                fieldType={"checkboxGroup"}
                renderer={CheckboxGroupFieldSettings}
            />
        </>
    );
};
