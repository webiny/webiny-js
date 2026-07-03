import React from "react";
import { useDialogParamsContext } from "@webiny/app-admin/components/Dialogs/DialogParamsContext.js";
import { TemplateDialog } from "./TemplateDialog.js";
import type { CmsDynamicZoneTemplate } from "~/types.js";

export const EDIT_DZ_TEMPLATE_DIALOG = "edit-dz-template";

export const EditTemplateDialog = () => {
    const { params, closeDialog } = useDialogParamsContext();
    const template = params.template as CmsDynamicZoneTemplate | undefined;
    const onTemplate = params.onTemplate as (template: CmsDynamicZoneTemplate) => void;

    return <TemplateDialog template={template} onTemplate={onTemplate} onClose={closeDialog} />;
};
