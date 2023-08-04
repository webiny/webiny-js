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
export * from "./components/Editor/EditorBar";
export * from "./components/Editor/EditorContent";
export { EditorProvider } from "./contexts/EditorProvider";
export {
    EditorSidebarTabs,
    EditorSidebarTab,
    EditorSidebarTabsProps,
    EditorSidebarTabProps
} from "./components/Editor/EditorSidebar";
export { SidebarActions } from "./components/Editor/Sidebar/ElementSettingsTabContent";
export { ToolbarActions } from "./components/Editor/Toolbar";
export { ElementSettingsRenderer } from "./plugins/elementSettings/advanced/ElementSettings";
export { default as DropZone } from "../editor/components/DropZone";
