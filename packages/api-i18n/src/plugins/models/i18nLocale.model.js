// @flow
import { flow } from "lodash";
import localesList from "i18n-locales";
import { withFields, onSet, string, boolean, withName, withHooks } from "@webiny/commodo";

export default ({ createBase }) => {
    const I18NLocale = flow(
        withName("I18NLocale"),
        withFields(instance => ({
            default: onSet(value => {
                if (value !== instance.code && value === true) {
                    instance.registerHookCallback("afterSave", async () => {
                        console.log("TODO: setOnce");

                        const defaultLocales = await I18NLocale.find({
                            query: { default: true, id: { $ne: instance.id } }
                        });

                        for (let i = 0; i < defaultLocales.length; i++) {
                            let defaultLocale = defaultLocales[i];
                            defaultLocale.default = false;
                            await defaultLocale.save();
                        }
                    });
                }

                return value;
            })(boolean()),
            code: string({
                validation: value => {
                    if (!value) {
                        throw Error("Locale code is required.");
                    }

                    if (localesList.includes(value)) {
                        return;
                    }
                    throw Error(`Value ${value} is not a valid locale code.`);
                }
            })
        })),
        withHooks({
            async beforeCreate() {
                const existingLocale = await I18NLocale.findOne({ query: { code: this.code } });
                if (existingLocale) {
                    throw Error(`Locale with key "${this.code}" already exists.`);
                }
            },
            async beforeDelete() {
                if (this.default) {
                    throw Error(
                        "Cannot delete default locale, please set another locale as default first."
                    );
                }

                const remainingLocalesCount = await I18NLocale.count({
                    query: { id: { $ne: this.id } }
                });

                if (remainingLocalesCount === 0) {
                    throw Error("Cannot delete the last locale.");
                }
            }
        })
    )(createBase());

    return I18NLocale;
};
