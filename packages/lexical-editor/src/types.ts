export type ToolbarType = "heading" | "paragraph" | string;
export type LexicalValue = string;
export { FontColorPicker } from "~/components/ToolbarActions/FontColorAction";

export type ImageActionType = "image-action";
export type ToolbarActionType = ImageActionType | string;
export interface ToolbarActionPlugin {
    targetAction: ToolbarActionType;
    plugin: Record<string, any> | ((cb: (value: any) => void) => any) | undefined;
}

/* Commands payload types */
export { ImagePayload } from "~/commands";

/* Lexical editor interfaces */
export { RichTextEditorProps } from "~/components/Editor/RichTextEditor";

// lexical types
export { Klass, LexicalNode } from "lexical";
