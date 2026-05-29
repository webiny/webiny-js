// Re-export the full framework-agnostic SDK surface (types, inputs, SDK instance, etc.)
export {
    createTextInput,
    createLongTextInput,
    createNumberInput,
    createBooleanInput,
    createColorInput,
    createFileInput,
    createDateInput,
    createLexicalInput,
    createSelectInput,
    createRadioInput,
    createObjectInput,
    createTagsInput,
    createSlotInput,
    createInput,
    createElement,
    createTheme,
    contentSdk,
    environment,
    setHeadersProvider,
    getHeadersProvider,
    registerComponentGroup,
    type CssProperties,
    type Document,
    type DocumentElement,
    type Breakpoint,
    type CreateElementParams,
    type ContentSDKConfig,
    type ComponentManifest,
    type ComponentInput,
    type ComponentConstraint,
    type WebsiteBuilderThemeInput,
    StyleSettings
} from "@webiny/website-builder-sdk";

// Vue-specific exports
export { createComponent } from "./createComponent.js";
export * from "./components/index.js";
export * from "./editorComponents/index.js";
export * from "./composables/useViewport.js";
export * from "./composables/useSelectFromState.js";
export * from "./composables/useObservable.js";
export * from "./composables/useBindingsForElement.js";
export * from "./composables/useDocumentState.js";
export type {
    ComponentProps,
    ComponentPropsWithChildren,
    InferManifest,
    InferComponentChange,
    InferDescendantChange
} from "./types.js";
