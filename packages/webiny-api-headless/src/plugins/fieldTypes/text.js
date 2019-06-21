// @flow
import type { HeadlessFieldTypePlugin } from "webiny-api-headless/types";

export default ({
    name: "cms-headless-field-type-text",
    type: "cms-headless-field-type",
    fieldType: "text",
    read: {
        createTypeField({ field }) {
            return `${field.fieldId}: String`;
        },
        createResolver({ field }) {
            return (entity, args, context, { fieldName }) => {
                if (field.i18n === false) {
                    return entity[fieldName];
                }

                const i18n = entity[fieldName].reduce((acc, v) => {
                    acc[v.locale] = v.value;
                    return acc;
                }, {});

                return i18n[context.locale] || i18n[context.defaultLocale];
            };
        }
    },
    manage: {
        setValue(value, entry, { field }) {
            if (!field.i18n) {
                entry[field.fieldId] = value;
                return;
            }

            const currentValue = entry[field.fieldId];
            if (Array.isArray(currentValue) && currentValue.length > 0) {
                const mergedValue = currentValue.map(model => ({
                    value: model.value,
                    locale: model.locale
                }));

                value.forEach(({ value, locale }) => {
                    const index = mergedValue.findIndex(v => v.locale === locale);
                    if (index === -1) {
                        mergedValue.push({ value, locale });
                    } else {
                        mergedValue[index].value = value;
                    }
                });

                entry[field.fieldId] = mergedValue;
                return;
            }

            entry[field.fieldId] = value;
        },
        createTypes() {
            return /* GraphQL */ `
                type Manage_HeadlessText {
                    locale: String
                    value: String
                }

                input Manage_HeadlessTextInput {
                    locale: String!
                    value: String!
                }
            `;
        },
        createTypeField({ field }) {
            if (field.i18n) {
                return field.fieldId + ": [Manage_HeadlessText]";
            }
            return field.fieldId + ": String";
        },
        createInputField({ field }) {
            if (field.i18n) {
                return field.fieldId + ": [Manage_HeadlessTextInput]";
            }
            return field.fieldId + ": String";
        }
    }
}: HeadlessFieldTypePlugin);
