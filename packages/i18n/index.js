// @flow
import I18n from "./src/I18n";
import defaultModifiers from "./src/modifiers";
import defaultProcessor from "./src/processors/default";

export { I18n, defaultModifiers, defaultProcessor };

const i18n = new I18n();

export default i18n;
