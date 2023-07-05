import { createCommand, LexicalCommand, LexicalEditor, NodeKey } from "lexical";

export interface ImagePayload {
    id: string;
    altText: string;
    caption?: LexicalEditor;
    height?: number;
    key?: NodeKey;
    maxWidth?: number;
    showCaption?: boolean;
    src: string;
    width?: number;
    captionsEnabled?: boolean;
}

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> =
    createCommand("INSERT_IMAGE_COMMAND");
