import { flow } from "lodash";
import { onGet, fields, withFields, withProps } from "@webiny/commodo";
import { validation } from "@webiny/validation";
import { GraphQLContext as CommodoContext } from "@webiny/api-plugin-commodo-db-proxy/types";
import { GraphQLContext as I18NContext } from "@webiny/api-i18n/types";

export type I18NField = {
    field: any;
    defaultValue: any;
    context: CommodoContext & I18NContext;
    [key: string]: any;
};

export const getI18NValues = (value: { [key: string]: any }[], i18n: I18NContext["i18n"]) => {
    // Let's make current locale's value the first element of the array.
    if (value.length < 2) {
        return value;
    }

    const currentLocale = i18n.getLocale();
    const currentLocaleItemIndex = value.findIndex(item => item.locale === currentLocale.id);

    const output = [...value];
    const [currentLocaleItem] = output.splice(currentLocaleItemIndex, 1);

    output.unshift(currentLocaleItem);

    return output;
};

export const i18nField = ({
    field,
    context: { i18n, commodo },
    ...rest
}: I18NField) => {
    const { id } = commodo.fields;

    return fields({
        ...rest,
        value: {},
        instanceOf: flow(
            withFields({
                values: onGet(value => getI18NValues(value, i18n))(
                    fields({
                        list: true,
                        value: [],
                        instanceOf: withFields({
                            locale: id({ validation: validation.create("required") }),
                            value: field
                        })()
                    })
                )
            }),
            withProps({
                value(code: string) {
                    let locale;
                    if (code) {
                        locale = i18n.getLocales().find(l => l.code === code);
                    }

                    if (!locale) {
                        locale = i18n.getDefaultLocale();
                    }

                    const value = this.values.find(value => value.locale === locale.id);
                    return value ? value.value : undefined;
                }
            })
        )()
    });
};
