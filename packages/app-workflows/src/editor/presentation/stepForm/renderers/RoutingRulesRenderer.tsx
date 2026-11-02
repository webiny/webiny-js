import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { RoutingRulesList } from "./routingRules/RoutingRulesList.js";
import "../stepFormRendererNames.js";

/*
 * Routing rules (R293): the renderer of the plain-JSON `assignment.rules` field. It owns no state;
 * `RoutingRulesList` draws the header, the cards and the commands over the options the drawer
 * provides (the step's teams and strategy, the pickers' lists, the rule issues and errors).
 */
export const RoutingRulesRenderer = createFieldRenderer<"workflowRoutingRules">(({ field }) => {
    return <RoutingRulesList field={field} />;
});
