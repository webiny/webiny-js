// @flow
import I18n from "./I18n";
import defaultModifiers from "./modifiers";
import defaultProcessor from "./processors/default";

export { I18n, defaultModifiers, defaultProcessor };

const i18n = new I18n();

export default i18n;
