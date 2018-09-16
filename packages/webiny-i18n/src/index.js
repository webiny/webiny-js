// @flow
import I18n from "./I18n";
import modifiers from "./modifiers";

export { default as defaultProcessor } from "./processors/default";
export { I18n, modifiers };

const i18n = new I18n();
i18n.registerModifiers(modifiers);

export default i18n;
