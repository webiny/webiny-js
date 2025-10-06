export * from "@webiny/app";
export type { HigherOrderComponent, ProviderProps, ComposeProps } from "@webiny/app";
// UI components
export * from "./base/ui/Tags.js";
export * from "./base/ui/Layout.js";
export * from "./base/ui/LocaleSelector.js";
export * from "./base/ui/TenantSelector.js";
export type { LayoutProps } from "./base/ui/Layout.js";
export * from "./base/ui/Navigation.js";
export * from "./base/ui/Brand.js";
export * from "./base/ui/Logo.js";
export * from "./base/ui/UserMenu.js";
export * from "./base/ui/LoginScreen.js";
export * from "./base/ui/CenteredView.js";
export * from "./base/ui/Dashboard.js";
export * from "./base/ui/NotFound.js";

// Base admin app
export { Admin } from "./base/Admin.js";
export * from "./config/AdminConfig.js";

export type { AdminProps } from "./base/Admin.js";

// Plugins
export * from "./base/plugins/AddGraphQLQuerySelection.js";
export * from "./plugins/PermissionRendererPlugin.js";

// Components
export * from "./components/index.js";

export { FileManager, FileManagerRenderer } from "./base/ui/FileManager.js";
export type {
    FileManagerProps,
    FileManagerRendererProps,
    FileManagerFileItem,
    FileManagerOnChange
} from "./base/ui/FileManager.js";

// Feature types
export type { AaclPermission } from "./features/wcp/types.js";
export type { Tenant } from "./features/tenancy/types.js";

// Hooks
export * from "./hooks/index.js";
export { useWcp } from "./presentation/wcp/useWcp.js";
export { useTenancy } from "./presentation/tenancy/useTenancy.js";
export { withTenant } from "./presentation/tenancy/withTenant.js";

export * from "@webiny/app/renderApp.js";

// Exporting chosen utils from `@webiny/app` package.
export * from "@webiny/app/utils/getApiUrl.js";
export * from "@webiny/app/utils/getGqlApiUrl.js";
export * from "@webiny/app/utils/getHeadlessCmsGqlApiUrl.js";
export * from "@webiny/app/utils/getLocaleCode.js";
export * from "@webiny/app/utils/getTenantId.js";
export * from "@webiny/app/utils/isLocalhost.js";
