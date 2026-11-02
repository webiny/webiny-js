import { AUTOMATION_FORM_MESSAGES } from "./automationFormMessages.js";

export interface SwitchAutomationConfirmationVm {
    title: string;
    body: string;
    cancelLabel: string;
    confirmLabel: string;
}

export interface SwitchConfirmationParams {
    nextName: string;
    currentName: string;
}

// The texts of "Switch to “{automation}”?" (QBZ-14); the signing-secret clause is dropped (D67).
export const buildSwitchConfirmation = (
    params: SwitchConfirmationParams
): SwitchAutomationConfirmationVm => {
    return {
        title: `Switch to “${params.nextName}”?`,
        body: `The settings for ${params.currentName} are cleared. The change applies when you save the workflow.`,
        cancelLabel: AUTOMATION_FORM_MESSAGES.switchCancel,
        confirmLabel: AUTOMATION_FORM_MESSAGES.switchConfirm
    };
};
