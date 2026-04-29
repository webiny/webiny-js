// Feature
export { FormModelFeature } from "./feature.js";

// Renderer registry augmentations
import "./renderers.js";

// Abstractions (types + DI tokens)
export {
    FormModelFactory,
    FormModel,
    RuleEvaluator,
    FieldType,
    FieldBuilderRegistry
} from "./abstractions.js";
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
    ITypedField,
    IFieldConfig,
    IFieldVM,
    IFieldValidation,
    IFormVM,
    IFormError,
    IValueOption,
    IRowNode,
    IRowNodeHandle,
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
    OnBlurCallback,
    CloneValueCallback,
    IFieldTypeFactory,
    FileValue
} from "./abstractions.js";

// Implementations
export { FormModel as FormModelImpl } from "./FormModel.js";
export { Field } from "./Field.js";
export { FieldBuilder, createFieldBuilderRegistry } from "./FieldBuilder.js";

// Field type augmentations (side-effect imports ensure declare module blocks are included)
import "./fieldTypes/TextFieldType.js";
import "./fieldTypes/NumberFieldType.js";
import "./fieldTypes/BooleanFieldType.js";
import "./fieldTypes/DateTimeFieldType.js";
import "./fieldTypes/FileFieldType.js";
import "./fieldTypes/FileUrlFieldType.js";
import "./fieldTypes/ObjectFieldType.js";

// Field types (DI-registered)
export {
    TextFieldType,
    TextFieldBuilder,
    NumberFieldType,
    NumberFieldBuilder,
    BooleanFieldType,
    BooleanFieldBuilder,
    DateTimeFieldType,
    DateTimeFieldBuilder,
    FileFieldType,
    FileFieldBuilder,
    FileUrlFieldType,
    FileUrlFieldBuilder,
    ObjectFieldType,
    ObjectFieldBuilder
} from "./fieldTypes/index.js";

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
