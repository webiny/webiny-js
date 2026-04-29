// Feature
export { FormModelFeature } from "./feature.js";

// Renderer registry augmentations
import "./renderers.js";

// Abstractions (types + DI tokens)
export { FormModelFactory, FormModel, RuleEvaluator } from "./abstractions.js";
export type {
    IFieldRendererRegistry,
    FieldRendererName,
    FieldRendererSettings,
    IFormModelFactory,
    IFormModelConfig,
    ILayoutBuilder,
    IFieldBuilder,
    IOptionsFieldBuilder,
    IObjectFieldBuilder,
    IFieldBuilderRegistry,
    IFormModel,
    IField,
    IObjectField,
    IObjectFieldConfig,
    IListItemField,
    IObjectFieldVM,
    IObjectFieldItemVM,
    ITemplate,
    ITemplateIcon,
    ITemplateConfig,
    ITemplateVM,
    IObjectFieldTemplatesAPI,
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
    IObjectNode,
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
    IRule,
    IRuleEvaluator,
    RuleAction,
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
    NumberFieldBuilder,
    BooleanFieldBuilder,
    DateTimeFieldBuilder,
    ObjectFieldBuilder,
    createFieldBuilderRegistry
} from "./FieldBuilder.js";
export type { IFieldTypeFactory } from "./FieldBuilder.js";

// Object field
export { ObjectField, isObjectField } from "./ObjectField.js";

// Rule evaluators
export { ConditionRuleEvaluator } from "./ConditionRuleEvaluator.js";

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
