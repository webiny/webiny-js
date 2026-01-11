export * from "./definitions/assignFields.js";
export * from "./definitions/AttributePlugin.js";
export * from "./definitions/DateTimeTransformPlugin.js";
export * from "./definitions/FieldPathPlugin.js";
export * from "./definitions/FieldPlugin.js";
export * from "./definitions/TimeTransformPlugin.js";
export * from "./definitions/ValueFilterPlugin.js";
export * from "./definitions/ValueTransformPlugin.js";
/**
 * List everything that needs to be loaded by default.
 */
import filterPlugins from "./filters/index.js";

export default () => {
    return [filterPlugins()];
};
