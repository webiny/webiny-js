// Admin framework
export * from "./admin/admin";
export * from "./admin/makeComposable";
export type { AdminProps, HigherOrderComponent } from "./admin/admin";
// Core components
export * from "./admin/components/core/Compose";
export * from "./admin/components/core/Extensions";
export * from "./admin/components/core/Provider";
export * from "./admin/components/core/Routes";
// UI components
export * from "./admin/components/ui/Menu";
export * from "./admin/components/ui/Layout";
export type { LayoutProps } from "./admin/components/ui/Layout";
export * from "./admin/components/ui/Navigation";
export type { MenuItemsProps } from "./admin/components/ui/Navigation";
export * from "./admin/components/ui/Brand";
export type { BrandProps, BrandRendererProps } from "./admin/components/ui/Brand";
export * from "./admin/components/ui/Search";
export type { SearchOptionData, SearchOptionProps } from "./admin/components/ui/Search";
export * from "./admin/components/ui/UserMenu";
export type { UserMenuItemProps } from "./admin/components/ui/UserMenu";
export * from "./admin/components/ui/LoginScreen";
// UI Shell - registers the headless UI context providers
export { Shell } from "./admin/shell";

export { AppInstaller } from "./components/AppInstaller";
export { default as Logo } from "./plugins/logo/Logo";
// export { default as SearchBar } from "./plugins/globalSearch/SearchBar";
