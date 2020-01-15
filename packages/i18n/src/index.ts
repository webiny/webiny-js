import I18n from "./I18n";
import defaultProcessor from "./processors/default";
import modifiersFactory from "./modifiers";

const i18n = new I18n();

const defaultModifiers = modifiersFactory({ i18n });

export default i18n;

export { I18n, defaultModifiers, defaultProcessor };
