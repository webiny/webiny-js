import { createCommand, LexicalCommand } from "lexical";

export type QuoteCommandPayload = {
    themeStyleId: string;
};

export const INSERT_QUOTE_COMMAND: LexicalCommand<QuoteCommandPayload> =
    createCommand("INSERT_QUOTE_COMMAND");
