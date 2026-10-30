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
    createContentEntryInput,
    createInput,
    createElement,
    createTheme,
    contentSdk,
    environment,
    setHeadersProvider,
    getHeadersProvider,
    registerComponentGroup,
    ASPECT_RATIO_PRESETS,
    type CssProperties,
    type Document,
    type DocumentElement,
    type Breakpoint,
    type CreateElementParams,
    type ContentSDKConfig,
    type ComponentManifest,
    type ComponentInput,
    type ContentEntryInput,
    type ContentEntryReference,
    type ContentEntryQueryConfig,
    type ContentEntryQueryValue,
    type ComponentConstraint,
    type WebsiteBuilderThemeInput,
    type AssetCrop,
    type AssetFocalPoint,
    type Asset,
    type AssetImage,
    type AssetDocument,
    type AssetVideo,
    type AssetCategory,
    normalizeToAsset,
    getAssetCategory,
    getAssetUrl,
    getAssetCropParam,
    type AssetUrlOptions,
    IMAGE_RESIZE_WIDTHS,
    getImageSrcSet,
    getImageDimensions,
    type ImageSrcSet,
    type ImageSrcSetOptions,
    type ImageDimensions,
    type AspectRatioInput,
    type AspectRatioPreset,
    StyleSettings
} from "@webiny/website-builder-sdk";

// Vue-specific exports
export { createComponent } from "@webiny/website-builder-sdk";
export * from "./components/index.js";
export * from "./editorComponents/index.js";
export * from "./composables/useViewport.js";
export * from "./composables/useSelectFromState.js";
export * from "./composables/useObservable.js";
export * from "./composables/useBindingsForElement.js";
export * from "./composables/useDocumentState.js";
export * from "./composables/useContentEntryList.js";
export type {
    ComponentProps,
    ComponentPropsWithChildren,
    InferManifest,
    InferComponentChange,
    InferDescendantChange
} from "./types.js";
