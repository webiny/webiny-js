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
export * from "./plugins/FileManagerFileTypePlugin";
export * from "./plugins/PermissionRendererPlugin";

// Components
export { AppInstaller } from "./components/AppInstaller";
export { OverlayLayout, OverlayLayoutProps } from "./components/OverlayLayout";
export {
    default as SingleImageUpload,
    SingleImageUploadProps
} from "./components/SingleImageUpload";

export { FileManager, FileManagerRenderer } from "./components/FileManager";
export type {
    FileManagerProps,
    FileManagerRendererProps,
    FileManagerFileItem
} from "./components/FileManager";

// Hooks
export * from "./hooks/useSnackbar";
export * from "./hooks/useConfirmationDialog";
export * from "./hooks/useDialog";
export { useWcp } from "@webiny/app-wcp";
