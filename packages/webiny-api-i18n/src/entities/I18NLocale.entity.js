// @flow
import { Entity } from "webiny-entity";
import localesList from "i18n-locales";

export interface II18NLocale extends Entity {
    createdBy: ?string;
    code: string;
    default: boolean;
}

export function i18nLocaleFactory(context: Object): Class<II18NLocale> {
    return class I18NLocale extends Entity {
        static classId = "I18NLocale";

        createdBy: ?string;
        code: string;
        default: boolean;
        constructor() {
            super();

            const { getUser } = context;

            this.attr("createdBy").char();
            this.attr("default")
                .boolean()
                .onSet(value => {
                    if (value !== this.code && value === true) {
                        this.on("afterSave", async () => {
                            const defaultLocales = await I18NLocale.find({
                                query: { default: true, id: { $ne: this.id } }
                            });

                            for (let i = 0; i < defaultLocales.length; i++) {
                                let defaultLocale = defaultLocales[i];
                                defaultLocale.default = false;
                                await defaultLocale.save();
                            }
                        }).setOnce();
                    }

                    return value;
                });

            this.attr("code")
                .char()
                .setValidators(value => {
                    if (!value) {
                        throw Error("Locale code is required.");
                    }

                    if (localesList.includes(value)) {
                        return;
                    }
                    throw Error(`Value ${value} is not a valid locale code.`);
                });

            this.on("beforeCreate", async () => {
                if (getUser()) {
                    this.createdBy = getUser().id;
                }

                const existingLocale = await I18NLocale.findOne({ query: { code: this.code } });
                if (existingLocale) {
                    throw Error(`Locale with key "${this.code}" already exists.`);
                }
            });

            this.on("beforeDelete", async () => {
                const remainingLocalesCount = await I18NLocale.count({
                    query: { id: { $ne: this.id } }
                });

                if (remainingLocalesCount === 0) {
                    throw Error("Cannot delete the last locale.");
                }

                if (remainingLocalesCount === 1) {
                    this.on("afterDelete", async () => {
                        // Set last remaining locale as default.
                        const remainingLocale = await I18NLocale.findOne();
                        if (!remainingLocale) {
                            return;
                        }

                        if (!remainingLocale.default) {
                            remainingLocale.default = true;
                            await remainingLocale.save();
                        }
                    }).setOnce();
                }
            });
        }
    };
}
