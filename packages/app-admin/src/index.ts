// IMPORTANT — do not import from this file (~/index.js) inside this package.
// Files exported here are part of the public API, but importing ~/index.js
// from within the package creates circular ESM dependency chains. In Babel's
// CJS output these cycles resolved lazily; in ESM the module body executes
// before the cycle resolves, so exported values are undefined at call time.
// Always import directly from the source file instead (e.g. "@webiny/react-composition"
// for makeDecoratable, "~/base/ui/Layout.js" for Layout, etc.).
export * from "@webiny/app";
export type { HigherOrderComponent, ProviderProps, ComposeProps } from "@webiny/app";
// UI components
export * from "./base/ui/Tags.js";
export * from "./base/ui/Layout.js";
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

// Permissions
export * from "./permissions/index.js";

// Components
export * from "./components/index.js";
export type { RichTextValueWithHtml } from "./components/index.js";
export { HasPermission } from "./presentation/security/components/HasPermission.js";
export { SecureRoute } from "./presentation/security/components/SecureRoute.js";

export { FileManager, FileManagerRenderer } from "./base/ui/FileManager.js";
export type {
    FileManagerProps,
    FileManagerRendererProps,
    FileManagerFileItem,
    FileManagerOnChange
} from "./base/ui/FileManager.js";

export { SystemInstallerProvider } from "./presentation/installation/components/SystemInstaller/index.js";

// Feature types
export type { AaclPermission } from "./features/wcp/types.js";
export type { Tenant } from "./features/tenancy/types.js";

export { BuildParamsFeature } from "./features/buildParams/feature.js";
export { ToolsFeature } from "./features/tools/feature.js";
export { Tool, ToolRegistry, ToolPipelineRunner } from "./features/tools/abstractions.js";
export type { ITool, IToolRegistry, IToolPipelineRunner } from "./features/tools/abstractions.js";

// Hooks
export * from "./hooks/index.js";
export { useWcp } from "./presentation/wcp/useWcp.js";
export { useTenantContext } from "./presentation/tenancy/useTenantContext.js";
export { useIdentity } from "./presentation/security/hooks/useIdentity.js";
export { useAuthentication } from "./presentation/security/hooks/useAuthentication.js";
export { useBuildParams } from "./presentation/buildParams/useBuildParams.js";

// Legacy hook for easier migration
export { useSecurity } from "./presentation/security/hooks/useSecurity.js";

export * from "@webiny/app/renderApp.js";

// FormModel
import "./features/formModel/renderers.js";
import "./features/formModel/fieldTypes/TextFieldType.js";
import "./features/formModel/fieldTypes/NumberFieldType.js";
import "./features/formModel/fieldTypes/BooleanFieldType.js";
import "./features/formModel/fieldTypes/DateTimeFieldType.js";
import "./features/formModel/fieldTypes/FileFieldType.js";
import "./features/formModel/fieldTypes/FileUrlFieldType.js";
import "./features/formModel/fieldTypes/ObjectFieldType.js";
import "./features/formModel/fieldTypes/LexicalFieldType.js";
export { FormModelFactory } from "./features/formModel/abstractions.js";
export type { FormModel } from "./features/formModel/abstractions.js";
export type {
    IFieldRendererRegistry,
    FieldRendererName,
    FieldRendererSettings,
    IFormModelFactory,
    IFormModelConfig,
    ILayoutBuilder,
    ILayoutNodeBuilder,
    IRowBuilder,
    ISeparatorBuilder,
    ITabsBuilder,
    IElementBuilder,
    IObjectBuilder,
    IFieldBuilder,
    IOptionsFieldBuilder,
    IFieldBuilderRegistry,
    IFormModel,
    IField,
    FieldTypeMap,
    IFieldConfig,
    IFieldVM,
    IFieldValidation,
    IFormVM,
    IFormError,
    IValueOption,
    IRowNode,
    IRowNodeVM,
    LayoutNode,
    LayoutNodeVM,
    LayoutPosition,
    IPositionedLayoutNode,
    ILayoutNodeHandle,
    ILayoutModifier,
    IFormModifier,
    BeforeChangeCallback,
    AfterChangeCallback,
    AfterSetValueCallback
} from "./features/formModel/abstractions.js";
export {
    FormView,
    LayoutNodeRenderer,
    useFormViewRenderers
} from "./features/formModel/FormView.js";
export { FormErrors } from "./features/formModel/FormErrors.js";
export { PresenterErrors } from "./features/formModel/PresenterErrors.js";

export { useFieldRenderers } from "./features/formModel/useFieldRenderers.js";
export { useLayoutRenderers } from "./features/formModel/useLayoutRenderers.js";
export type {
    FieldRenderers,
    FieldRendererComponent,
    LayoutRenderers,
    TabsNodeRendererProps
} from "./features/formModel/FormView.js";
