import { createCommand, LexicalCommand } from "lexical";

export type WebinyListCommandPayload = {
    themeStyleId?: string;
};

export const INSERT_UNORDERED_WEBINY_LIST_COMMAND: LexicalCommand<WebinyListCommandPayload> =
    createCommand("INSERT_UNORDERED_WEBINY_LIST_COMMAND");
export const INSERT_ORDERED_WEBINY_LIST_COMMAND: LexicalCommand<WebinyListCommandPayload> =
    createCommand("INSERT_ORDERED_WEBINY_LIST_COMMAND");

export const REMOVE_WEBINY_LIST_COMMAND: LexicalCommand<void> = createCommand(
    "REMOVE_WEBINY_LIST_COMMAND"
);
