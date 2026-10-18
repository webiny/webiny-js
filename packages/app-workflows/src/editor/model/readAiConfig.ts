import { isRecord } from "./isRecord.js";

export interface AiConfigValue {
    instructions: string;
    model: string;
    // Includes names no tool lists any more; they are kept on save (R275).
    tools: string[];
}

export const readAiConfig = (config: unknown): AiConfigValue => {
    if (!isRecord(config)) {
        return { instructions: "", model: "", tools: [] };
    }
    const instructions = typeof config.instructions === "string" ? config.instructions : "";
    const model = typeof config.model === "string" ? config.model : "";
    const tools = Array.isArray(config.tools) ? config.tools : [];

    return {
        instructions,
        model,
        tools: tools.filter((tool): tool is string => typeof tool === "string")
    };
};
