import { isRecord } from "./isRecord.js";

export interface AutomationConfigValue {
    automationId: string;
    settings: Record<string, unknown>;
}

export const readAutomationConfig = (config: unknown): AutomationConfigValue => {
    if (!isRecord(config)) {
        return { automationId: "", settings: {} };
    }
    const automationId = typeof config.automationId === "string" ? config.automationId : "";
    const settings = isRecord(config.settings) ? config.settings : {};

    return { automationId, settings };
};
