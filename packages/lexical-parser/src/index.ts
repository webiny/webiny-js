import { isValidLexicalData } from "~/utils/isValidLexicalData";
import { parse } from "~/parse";
import { createConfigMap } from "~/utils/createConfigMap";
import { defaultLexicalNodeConfigList } from "~/config";
import { LexicalParserConfig, LexicalValue } from "~/types";

let generalLexicalNodeConfigList: LexicalParserConfig = [];

/**
 * General or app level configuration.
 * @param lexicalNodeConfigList
 */
export const configureLexicalParser = (lexicalNodeConfigList: LexicalParserConfig) => {
    generalLexicalNodeConfigList = [...lexicalNodeConfigList];
};

export const parseLexicalObject = (
    value: LexicalValue,
    config?: LexicalParserConfig
): Record<string, any> | null => {
    generalLexicalNodeConfigList = config
        ? [...config] // will override the general configuration
        : [...defaultLexicalNodeConfigList, ...generalLexicalNodeConfigList];

    if (!isValidLexicalData(value)) {
        return null;
    }
    const configMap = createConfigMap(generalLexicalNodeConfigList);
    return configMap ? parse(value, configMap) : null;
};
