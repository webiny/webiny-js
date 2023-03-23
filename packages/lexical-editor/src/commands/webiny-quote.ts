import { createCommand, LexicalCommand } from "lexical";

export type WebinyQuoteCommandPayload = {
    themeStyleId: string;
};

export const INSERT_WEBINY_QUOTE_COMMAND: LexicalCommand<WebinyQuoteCommandPayload> =
    createCommand("INSERT_WEBINY_QUOTE_COMMAND");
