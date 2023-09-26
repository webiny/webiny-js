import { LexicalNodeProcessorConfig, LexicalParserConfig } from "~/types";

export const createConfigMap = (
    config: LexicalParserConfig
): Map<string, LexicalNodeProcessorConfig> | null => {
    if (!config?.processors?.length) {
        return null;
    }

    const map = new Map<string, LexicalNodeProcessorConfig>();
    for (const configElement of config.processors) {
        map.set(configElement?.elementNode.type, configElement);
    }

    return map;
};
