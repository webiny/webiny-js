import { LexicalNodeConfig, LexicalParserConfig } from "~/types";

export const createConfigMap = (
    configNodeList: LexicalParserConfig
): Map<string, LexicalNodeConfig> | null => {
    if (!configNodeList?.length) {
        return null;
    }

    const map = new Map<string, LexicalNodeConfig>();
    for (const configElement of configNodeList) {
        map.set(configElement?.elementNode.type, configElement);
    }

    return map;
};
