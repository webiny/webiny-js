import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-page-builder";
import { TextareaFieldRenderer } from "./TextareaFieldRenderer";
import { ELEMENT_TYPE } from "./constants";
import { TextareaFieldSettings } from "./TextareaFieldSettings";
import { PbEditorFunnelFieldSettingsPlugin } from "../../../admin/plugins/PbEditorFunnelFieldSettingsPlugin";
import { PbEditorFunnelFieldPageElementPlugin } from "../../../admin/plugins/PbEditorFunnelFieldPageElementPlugin";
import { ReactComponent as TextIcon } from "@material-design-icons/svg/outlined/text_fields.svg";

export const TextareaFieldAdminPlugins = () => {
    return (
        <>
            <PbRenderElementPlugin elementType={ELEMENT_TYPE} renderer={TextareaFieldRenderer} />
            <PbEditorFunnelFieldPageElementPlugin
                fieldType={"textarea"}
                renderer={TextareaFieldRenderer}
                name={"Textarea"}
                description={"Descriptions, comments or paragraphs or text"}
                icon={<TextIcon />}
            />

            <PbEditorFunnelFieldSettingsPlugin
                fieldType={"textarea"}
                renderer={TextareaFieldSettings}
            />
        </>
    );
};
