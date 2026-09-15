import { createAbstraction } from "@webiny/feature/api";

export interface ILexicalParser {
    parse(html: string): Promise<Record<string, unknown> | null>;
}

export const LexicalParser = createAbstraction<ILexicalParser>(
    "AiPowerUps/WbTranslatePage/LexicalParser"
);

export namespace LexicalParser {
    export type Interface = ILexicalParser;
}
