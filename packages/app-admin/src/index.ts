export * from "@webiny/app";
export type { HigherOrderComponent, ProviderProps, ComposeProps } from "@webiny/app";
// UI components
export * from "./base/ui/Tags";
export * from "./base/ui/Menu";
export * from "./base/ui/Layout";
export * from "./base/ui/LocaleSelector";
export type { LayoutProps } from "./base/ui/Layout";
export * from "./base/ui/Navigation";
export type { MenuItemsProps } from "./base/ui/Navigation";
export * from "./base/ui/Brand";
export * from "./base/ui/Logo";
export * from "./base/ui/Search";
export type { SearchOptionData, SearchOptionProps } from "./base/ui/Search";
export * from "./base/ui/UserMenu";
export type { UserMenuItemProps } from "./base/ui/UserMenu";
export * from "./base/ui/LoginScreen";
export * from "./base/ui/CenteredView";
export * from "./base/ui/Dashboard";
export * from "./base/ui/NotFound";

// Base admin app
export { Admin } from "./base/Admin";
export type { AdminProps } from "./base/Admin";
export { useViewComposition } from "./base/providers/ViewCompositionProvider";
export type { ViewCompositionContext, ViewElement } from "./base/providers/ViewCompositionProvider";

// Plugins
export * from "./base/plugins/AddGraphQLQuerySelection";
export * from "./plugins/PermissionRendererPlugin";

// Components
export { AppInstaller } from "./components/AppInstaller";
export * from "./components/Buttons";
export { DialogsProvider } from "./components/Dialogs/DialogsContext";
export * from "./components/OptionsMenu";
export * from "./components/Filters";
export * from "./components/BulkActions";
export * from "./components/ResizablePanels";
export { OverlayLayout, OverlayLayoutProps } from "./components/OverlayLayout";
export {
    default as SingleImageUpload,
    SingleImageUploadProps
} from "./components/SingleImageUpload";
export { LexicalEditor } from "./components/LexicalEditor/LexicalEditor";
export { Wcp } from "./components/Wcp";
export * from "./components/IconPicker";

export { FileManager, FileManagerRenderer } from "./base/ui/FileManager";
export type {
    FileManagerProps,
    FileManagerRendererProps,
    FileManagerFileItem,
    FileManagerOnChange
} from "./base/ui/FileManager";

// Hooks
export * from "./hooks";
export { useWcp } from "@webiny/app-wcp";
export { AaclPermission } from "@webiny/app-wcp/types";

// Theme
export { useTheme, ThemeProvider } from "@webiny/app-theme";

export * from "@webiny/app/renderApp";
