import type React from "react";
import type { FormModel } from "@webiny/app-admin";
import { ObjectRenderer } from "@webiny/app-admin/base/Base/FieldRenderers/ObjectRenderer/ObjectRenderer.js";
import { AssignmentStrategyRenderer } from "~/editor/presentation/stepForm/renderers/AssignmentStrategyRenderer.js";
import { FolderPickerRenderer } from "~/editor/presentation/stepForm/renderers/FolderPickerRenderer.js";
import { RoutingRulesRenderer } from "~/editor/presentation/stepForm/renderers/RoutingRulesRenderer.js";
import { StepColourRenderer } from "~/editor/presentation/stepForm/renderers/StepColourRenderer.js";
import { TeamsPickerRenderer } from "~/editor/presentation/stepForm/renderers/TeamsPickerRenderer.js";
import { TestRoutingRenderer } from "~/editor/presentation/stepForm/renderers/TestRoutingRenderer.js";
import { TransportCheckboxesRenderer } from "~/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.js";
import { UserPickerRenderer } from "~/editor/presentation/stepForm/renderers/UserPickerRenderer.js";
import { STEP_FORM_RENDERER } from "~/editor/presentation/stepForm/stepFormRendererNames.js";

export type PeopleDrawerRenderers = Record<
    string,
    React.ComponentType<{ field: FormModel.FieldVM }>
>;

/*
 * What `WorkflowEditorConfig` registers for the People step form, as the `renderers` map of
 * `FormView`. The stock `objectAccordionSingle` renderer is listed because the Assignment tab is an
 * object field rendered by it (without a container). The stock switch of `allowManualPick` is not listed: `FormView` leaves a field
 * without a renderer out, which these tests do not need.
 */
export const PEOPLE_DRAWER_RENDERERS: PeopleDrawerRenderers = {
    objectAccordionSingle: ObjectRenderer,
    [STEP_FORM_RENDERER.colour]: StepColourRenderer,
    [STEP_FORM_RENDERER.teams]: TeamsPickerRenderer,
    [STEP_FORM_RENDERER.transports]: TransportCheckboxesRenderer,
    workflowAssignmentStrategy: AssignmentStrategyRenderer,
    workflowRoutingRules: RoutingRulesRenderer,
    workflowUserPicker: UserPickerRenderer,
    workflowFolderPicker: FolderPickerRenderer,
    "element:workflowTestRouting": TestRoutingRenderer
};
