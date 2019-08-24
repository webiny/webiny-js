// @flow
import setupEntities from "./setupEntities";
import { get } from "lodash";

export default async (context: Object) => {
    setupEntities(context);
    const { I18NLocale } = context.i18n.entities;

    const defaultLocale = new I18NLocale();
    defaultLocale.code = get(context, "i18n.locale", "en-US");
    defaultLocale.default = true;
    await defaultLocale.save();
};
