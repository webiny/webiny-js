import I18n from "./I18n";
import defaultProcessor from "./processors/default";
declare const i18n: I18n;
declare const defaultModifiers: import("./types").Modifier[];
export default i18n;
export { I18n, defaultModifiers, defaultProcessor };
