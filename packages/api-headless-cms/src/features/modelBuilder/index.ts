export * from "./abstractions.js";
export * from "./models/PrivateModelBuilder.js";
export * from "./models/PublicModelBuilder.js";
export * from "./feature.js";
export * from "./fields/FieldBuilder.js";
export * from "./fields/abstractions.js";
export * from "./models/abstractions.js";

// Import all field types to ensure their module augmentations are applied
// These imports have side effects that add methods to IFieldBuilderRegistry
import "./fields/TextFieldType.js";
import "./fields/LongTextFieldType.js";
import "./fields/RichTextFieldType.js";
import "./fields/NumberFieldType.js";
import "./fields/BooleanFieldType.js";
import "./fields/FileFieldType.js";
import "./fields/DateTimeFieldType.js";
import "./fields/ObjectFieldType.js";
import "./fields/RefFieldType.js";
import "./fields/DynamicZoneFieldType.js";
import "./fields/LocationFieldType.js";
import "./fields/JsonFieldType.js";
import "./fields/SearchableJsonFieldType.js";
