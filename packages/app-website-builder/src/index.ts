export * as Editor from "./BaseEditor/index.js";
export * from "./shared/pagePathFromTitle.js";
export { PageListConfig } from "~/presentation/pages/PageList/configs/index.js";
export { RedirectListConfig } from "~/presentation/redirects/RedirectList/index.js";
export { PageEditorConfig } from "~/presentation/pages/PageEditor/PageEditorConfig.js";
export { PreviewUrlModifier } from "./features/index.js";

// For extensions that work on the page open in the editor, such as the AI assistant's page tools.
export { useDocumentEditor } from "./DocumentEditor/index.js";
export { useSelectFromEditor } from "./BaseEditor/hooks/useSelectFromEditor.js";
export { $getElementInputValues } from "./editorSdk/utils/index.js";
export { $updateElementInputs } from "./editorSdk/utils/index.js";
export type { Editor as EditorInstance } from "./editorSdk/Editor.js";
