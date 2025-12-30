export { Admin } from "./Admin.js";
export type { AdminProps } from "./Admin.js";
export {
    useApp,
    useWcp,
    useTags,
    Dashboard,
    DashboardRenderer,
    Layout,
    LayoutRenderer,
    LoginScreen,
    LoginScreenRenderer,
    LocaleSelector,
    LocaleSelectorRenderer,
    Brand,
    BrandRenderer,
    Provider,
    Compose,
    CompositionScope,
    Plugins,
    Plugin,
    AdminConfig,
    makeComposable,
    makeDecoratable,
    createComponentPlugin,
    createProviderPlugin,
    createDecorator,
    createProvider,
    Navigation,
    NavigationRenderer,
    Tags,
    UserMenu,
    UserMenuHandle,
    UserMenuHandleRenderer,
    UserMenuItem,
    UserMenuItemRenderer,
    AddGraphQLQuerySelection
} from "@webiny/app-admin";
export type {
    ComposeProps,
    HigherOrderComponent,
    Decorator,
    ProviderProps,
    LayoutProps,
    LoginScreenProps
} from "@webiny/app-admin";

export { useTenancy } from "@webiny/app-admin";
export type { Tenant } from "@webiny/app-admin";

export * from "./apolloClientFactory.js";
