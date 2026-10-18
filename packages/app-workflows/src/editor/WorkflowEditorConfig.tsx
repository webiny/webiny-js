import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { STEP_FORM_RENDERER } from "~/editor/presentation/stepForm/stepFormRendererNames.js";
import { StepColourRenderer } from "~/editor/presentation/stepForm/renderers/StepColourRenderer.js";
import { TeamsPickerRenderer } from "~/editor/presentation/stepForm/renderers/TeamsPickerRenderer.js";
import { TransportCheckboxesRenderer } from "~/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.js";

// The editor's field renderers, registered the way `app-file-manager/src/app.tsx` registers its own.
export const WorkflowEditorConfig = () => {
    return (
        <AdminConfig>
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.colour}
                component={StepColourRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.teams}
                component={TeamsPickerRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.transports}
                component={TransportCheckboxesRenderer}
            />
        </AdminConfig>
    );
};
