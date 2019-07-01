// @flow
import setupEntities from "./setupEntities";

export default async (context: Object) => {
    setupEntities(context);
    const { I18NLocale } = context.i18n.entities;

    const defaultLocale = new I18NLocale();
    defaultLocale.code = "en-US";
    defaultLocale.default = true;
    await defaultLocale.save();
};
