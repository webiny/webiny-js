import type { FormModel } from "@webiny/app-admin";

/*
 * The id of the tab the form has open, or null when the form has no tabs (an Automation or AI
 * step, a read-only step). The drawer view reads it inside its reactive component, so it follows
 * the form's tab changes (a click, or `focusField` activating the tab of an error).
 */
export const getActiveTabId = (form: FormModel.FormVM | null): string | null => {
    if (form === null) {
        return null;
    }
    for (const node of form.layout) {
        if (node.type === "tabs") {
            return node.activeTabId;
        }
    }
    return null;
};
