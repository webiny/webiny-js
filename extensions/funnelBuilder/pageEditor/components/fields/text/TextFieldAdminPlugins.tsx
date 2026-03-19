import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-page-builder";
import { TextFieldRenderer } from "./TextFieldRenderer";
import { ELEMENT_TYPE } from "./constants";
import { TextFieldSettings } from "./TextFieldSettings";
import { PbEditorFunnelFieldSettingsPlugin } from "../../../admin/plugins/PbEditorFunnelFieldSettingsPlugin";
import { PbEditorFunnelFieldPageElementPlugin } from "../../../admin/plugins/PbEditorFunnelFieldPageElementPlugin";
import { ReactComponent as TextIcon } from "@material-design-icons/svg/outlined/text_fields.svg";

export const TextFieldAdminPlugins = () => {
    return (
        <>
            <PbRenderElementPlugin elementType={ELEMENT_TYPE} renderer={TextFieldRenderer} />
            <PbEditorFunnelFieldPageElementPlugin
                fieldType={"text"}
                renderer={TextFieldRenderer}
                name={"Short Text"}
                description={"Titles, names, single line input"}
                icon={<TextIcon />}
            />

            <PbEditorFunnelFieldSettingsPlugin fieldType={"text"} renderer={TextFieldSettings} />
        </>
    );
};
