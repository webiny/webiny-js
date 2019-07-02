// @flow
import { i18nLocaleFactory } from "./../../entities/I18NLocale.entity";

export default (context: Object) => {
    context.i18n = { ...context.i18n, entities: {} };
    context.i18n.entities.I18NLocale = i18nLocaleFactory(context);
};
