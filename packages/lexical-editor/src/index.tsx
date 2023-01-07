// presets


export { ParagraphToolbarPreset } from "~/components/ToolbarPresets/ParagraphToolbarPreset";
export { HeadingToolbarPreset } from "./components/ToolbarPresets/HeadingToolbarPreset";

// editor
export { RichTextEditor } from "~/components/Editor/RichTextEditor";
export { HeadingEditor } from "~/components/Editor/HeadingEditor";
export { ParagraphEditor } from "~/components/Editor/ParagraphEditor";

// composition
export  { AddToolbarAction } from "~/components/ToolbarComposable/AddToolbarAction";
export { AddRichTextEditorPlugin } from "~/components/EditorComposable/AddRichTextEditorPlugin";
// utils
export { isHeadingTag, isEditorSupportedTag, editorSupportedTags } from "~/utils/htmlTags";
export { getEmptyEditorStateJSONString } from "~/utils/getEmptyEditorStateJSONString";
//types
export * as types from "./types";
