export * from "@webiny/app-admin-core";
export type { HigherOrderComponent, ProviderProps, ComposeProps } from "@webiny/app-admin-core";
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

// Components
export { AppInstaller } from "./components/AppInstaller";

// Hooks
export * from "./hooks/useSnackbar";
export * from "./hooks/useConfirmationDialog";
export * from "./hooks/useDialog";
export { useWcp } from "@webiny/app-wcp";
