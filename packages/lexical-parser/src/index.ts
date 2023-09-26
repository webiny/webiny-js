import { isValidLexicalData } from "~/utils/isValidLexicalData";
import { parse } from "~/parse";
import { createConfigMap } from "~/utils/createConfigMap";
import { defaultLexicalParserConfig } from "~/config";
import { LexicalParserConfig, LexicalValue } from "~/types";

let configuration: LexicalParserConfig;

export const configureLexicalParser = (config: LexicalParserConfig) => {
    configuration = { ...config };
};

export const parseLexicalObject = (value: LexicalValue): Record<string, any> | null => {
    configuration = { ...defaultLexicalParserConfig, ...configuration };
    if (!isValidLexicalData(value)) {
        return null;
    }
    const configMap = createConfigMap(configuration);
    return configMap ? parse(value, configMap) : null;
};
