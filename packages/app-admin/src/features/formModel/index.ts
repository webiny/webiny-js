// Feature
export { FormModelFeature } from "./feature.js";

// Renderer registry augmentations
import "./renderers.js";

// Abstractions (types + DI tokens)
export { FormModelFactory, FormModel } from "./abstractions.js";
export type {
    IFieldRendererRegistry,
    FieldRendererName,
    FieldRendererSettings,
    IFormModelFactory,
    IFormModelConfig,
    ILayoutBuilder,
    IFieldBuilder,
    ISelectFieldBuilder,
    IObjectFieldBuilder,
    IFieldBuilderRegistry,
    IFormModel,
    IField,
    ISelectField,
    IObjectField,
    IObjectFieldConfig,
    IListItemField,
    IObjectFieldVM,
    IObjectFieldItemVM,
    FieldTypeMap,
    IFieldConfig,
    IFieldVM,
    IFieldValidation,
    IFormVM,
    IFormError,
    IValueOption,
    IRowNode,
    IRowNodeVM,
    ISeparatorNode,
    ISeparatorNodeVM,
    ITabsNode,
    ITabDefinition,
    ITabsNodeVM,
    ITabDefinitionVM,
    IElementNode,
    IElementNodeVM,
    ILayoutNodeAccessHandle,
    ITabsHandle,
    ITabHandle,
    LayoutNode,
    LayoutNodeVM,
    LayoutPosition,
    IPositionedLayoutNode,
    ILayoutNodeHandle,
    ILayoutModifier,
    IFormModifier,
    BeforeChangeCallback,
    AfterChangeCallback,
    AfterSetValueCallback,
    OnBlurCallback
} from "./abstractions.js";

// Implementations
export { FormModel as FormModelImpl } from "./FormModel.js";
export { Field } from "./Field.js";
export {
    FieldBuilder,
    TextFieldBuilder,
    SelectFieldBuilder,
    ObjectFieldBuilder,
    createFieldBuilderRegistry
} from "./FieldBuilder.js";
export type { IFieldTypeFactory } from "./FieldBuilder.js";

// Object field
export { ObjectField, isObjectField } from "./ObjectField.js";

// View
export { FormView, LayoutNodeRenderer, useFormViewRenderers } from "./FormView.js";
export { useFieldRenderers } from "./useFieldRenderers.js";
export { useLayoutRenderers } from "./useLayoutRenderers.js";
export type {
    FieldRenderers,
    FieldRendererComponent,
    LayoutRenderers,
    TabsNodeRendererProps
} from "./FormView.js";
