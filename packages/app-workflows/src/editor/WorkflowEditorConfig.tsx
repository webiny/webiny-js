import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { STEP_FORM_RENDERER } from "~/editor/presentation/stepForm/stepFormRendererNames.js";
import { StepColourRenderer } from "~/editor/presentation/stepForm/renderers/StepColourRenderer.js";
import { TeamsPickerRenderer } from "~/editor/presentation/stepForm/renderers/TeamsPickerRenderer.js";
import { TransportCheckboxesRenderer } from "~/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.js";
import { AutomationCardsRenderer } from "~/editor/presentation/stepForm/renderers/AutomationCardsRenderer.js";
import { AiModelPickerRenderer } from "~/editor/presentation/stepForm/renderers/AiModelPickerRenderer.js";
import { AiToolsRenderer } from "~/editor/presentation/stepForm/renderers/AiToolsRenderer.js";
import { UserPickerRenderer } from "~/editor/presentation/stepForm/renderers/UserPickerRenderer.js";
import { FolderPickerRenderer } from "~/editor/presentation/stepForm/renderers/FolderPickerRenderer.js";
import { AssignmentStrategyRenderer } from "~/editor/presentation/stepForm/renderers/AssignmentStrategyRenderer.js";

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
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.automations}
                component={AutomationCardsRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.aiModel}
                component={AiModelPickerRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.aiTools}
                component={AiToolsRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.userPicker}
                component={UserPickerRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.folderPicker}
                component={FolderPickerRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.assignmentStrategy}
                component={AssignmentStrategyRenderer}
            />
        </AdminConfig>
    );
};
