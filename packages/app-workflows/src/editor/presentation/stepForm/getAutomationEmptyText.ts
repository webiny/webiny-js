import { AUTOMATION_FORM_MESSAGES } from "./automationFormMessages.js";

// The reason shown when no automation covers the model (R269, QBZ-44): pages in the Website Builder.
export const getAutomationEmptyText = (namespace: string | null): string => {
    if (namespace !== null && namespace.startsWith("wb.")) {
        return AUTOMATION_FORM_MESSAGES.noAutomationsForPages;
    }
    return AUTOMATION_FORM_MESSAGES.noAutomationsForModel;
};
