import { createCommand, LexicalCommand } from "lexical";
import { LinkAttributes } from "@lexical/link";

export interface LinkNodePayload extends LinkAttributes {
    url: string;
    alt?: string;
}

export const TOGGLE_LINK_NODE_COMMAND: LexicalCommand<string | LinkNodePayload | null> =
    createCommand("TOGGLE_LINK_NODE_COMMAND");
