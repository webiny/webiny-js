import { createCommand, LexicalCommand } from "lexical";

export type ListCommandPayload = {
    themeStyleId?: string;
};

export const INSERT_UNORDERED_LIST_COMMAND: LexicalCommand<ListCommandPayload> = createCommand(
    "INSERT_UNORDERED_LIST_COMMAND"
);

export const INSERT_ORDERED_LIST_COMMAND: LexicalCommand<ListCommandPayload> = createCommand(
    "INSERT_ORDERED_LIST_COMMAND"
);

export const REMOVE_LIST_COMMAND: LexicalCommand<void> = createCommand("REMOVE_LIST_COMMAND");
