/**
 * This file contains the base framework for building editor variations.
 * Currently, we have 2 editors:
 * - page editor
 * - block editor
 *
 * This framework provides the basic mechanics, like d&d elements, element settings, toolbars, etc.
 * Other things, like loading/saving data to and from the GraphQL API, toolbar elements, etc. need
 * to be provided using the composition API, <EditorConfig> component, and `createStateInitializer` prop.
 */
export { EditorConfig } from "./components/Editor/EditorConfig";
export { DefaultEditorConfig } from "./defaultConfig/DefaultEditorConfig";
export * from "./components/Editor/EditorBar";
export { EditorProvider } from "./contexts/EditorProvider";
export { default as DropZone } from "../editor/components/DropZone";
