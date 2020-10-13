import { compose } from "ramda";
import { withName } from "@commodo/name";
import { Batch } from "@commodo/fields-storage";
import { withHooks } from "@commodo/hooks";
import localesList from "i18n-locales";
import { withProps } from "repropose";
import { withFields, string, boolean, onSet, skipOnPopulate, setOnce } from "@commodo/fields";
import { PK_DEFAULT_LOCALE, DefaultLocaleData } from "./defaultLocaleData.model";

export const PK_LOCALE = "L";

// We define two "data" field models - LocaleData and DefaultLocaleData.
export const LocaleData = compose(
    withName(PK_LOCALE),
    withProps({
        skipDefaultLocaleCheck: false
    }),
    withFields(dataInstance => ({
        __type: string({ value: PK_LOCALE }),
        default: onSet(value => {
            // If no change, just return value.
            if (value === dataInstance.default) {
                return value;
            }

            // If this locale was set as default, we load the previous one (if exists) and unset it as default.
            if (value) {
                // After save, let's set previous default as not-default.
                // Note that all hook callbacks we register here will receive parent model instance as its first
                // argument. Check the `withHooks` implementation in the main model, at the bottom of this file.
                const removeCallback = dataInstance.hook("afterSave", async parentInstance => {
                    removeCallback();

                    // First, load the default locale entry.
                    const defaultLocaleEntry = await parentInstance.constructor.findOne({
                        query: { PK: PK_DEFAULT_LOCALE, SK: "default" }
                    });

                    // Instantiate a new batch.
                    const batch = new Batch();

                    if (defaultLocaleEntry) {
                        // If the PK_DEFAULT_LOCALE entry exists (meaning a default locale exists), then update it.
                        // First, with the `data.code` from the found PK_DEFAULT_LOCALE entry, load the previous
                        // PK_LOCALE entry, and set its `default: true` to `default: false`.
                        const previousDefaultLocale = await parentInstance.constructor.findOne({
                            query: { PK: PK_LOCALE, SK: defaultLocaleEntry.data.code }
                        });

                        const rmAfterCallback = previousDefaultLocale.hook("beforeSave", () => {
                            rmAfterCallback();
                            previousDefaultLocale.skipDefaultLocaleCheck = true;
                        });

                        const rmBeforeCallback = previousDefaultLocale.hook("afterSave", () => {
                            rmBeforeCallback();
                            previousDefaultLocale.skipDefaultLocaleCheck = false;
                        });

                        previousDefaultLocale.data.default = false;
                        batch.push([previousDefaultLocale, "save"]);

                        // Secondly and finally, update the PK_DEFAULT_LOCALE entry, with the new default locale code.
                        defaultLocaleEntry.data.code = dataInstance.code;
                        batch.push([defaultLocaleEntry, "save"]);
                    } else {
                        // If the default locale doesn't exist (PK_DEFAULT_LOCALE entry wasn't found), then just
                        // create a new one. In this case, we don't need to do any additional actions.
                        const newDefaultLocaleEntry = new parentInstance.constructor();
                        newDefaultLocaleEntry.PK = PK_DEFAULT_LOCALE;
                        newDefaultLocaleEntry.SK = "default";
                        newDefaultLocaleEntry.data = new DefaultLocaleData().populate({
                            code: dataInstance.code
                        });

                        batch.push([newDefaultLocaleEntry, "save"]);
                    }

                    // Whatever the case we hit above, let's just execute the operations in the batch.
                    await batch.execute();
                });

                return value;
            }

            if (dataInstance.skipDefaultLocaleCheck) {
                return value;
            }

            // When setting `default: false`, we need to check if we are trying to set the already-default
            // locale as non-default. We can't have a system without the default locale.
            const removeCallback = dataInstance.hook("beforeSave", async parentInstance => {
                removeCallback();
                const defaultLocale = await parentInstance.constructor.findOne({
                    query: { PK: PK_DEFAULT_LOCALE, SK: "default" }
                });

                if (!defaultLocale || defaultLocale.data.code === this.code) {
                    throw new Error(
                        `Cannot unset the ${this.code} locale as the default one - there must be at least one default locale.`
                    );
                }
            });

            return value;
        })(boolean()),
        code: setOnce()(
            string({
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
        ),
        createdOn: compose(skipOnPopulate(), setOnce())(string({ value: new Date().toISOString() }))
    })),
    withHooks({
        async beforeCreate(parent) {
            const existingLocale = await parent.constructor.findOne({
                query: { PK: PK_LOCALE, SK: this.code }
            });

            if (existingLocale) {
                throw Error(`Locale with key "${this.code}" already exists.`);
            }
        },
        async beforeDelete(parent) {
            if (this.default) {
                throw Error(
                    "Cannot delete default locale, please set another locale as default first."
                );
            }

            const localesCount = await parent.constructor.find({
                query: { PK: PK_LOCALE, SK: { $gt: " " } }
            });

            if (localesCount.length === 1) {
                throw Error("Cannot delete the last locale.");
            }
        }
    })
)();
