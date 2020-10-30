import { pipe, onGet, fields, withFields, withProps, withName } from "@webiny/commodo";
import { validation } from "@webiny/validation";
import { Context as CommodoContext } from "@webiny/api-plugin-commodo-db-proxy/types";
import { HandlerI18NContext } from "@webiny/api-i18n/types";
import isEqual from "fast-deep-equal";

const getRawData = value => {
    return { values: value.values.map(v => ({ locale: v.locale, value: v.value })) };
};

export type I18NField = {
    field?: any;
    createField?: (valuesInstance: any) => any;
    context: CommodoContext & HandlerI18NContext;
    [key: string]: any;
};

export const getI18NValueItem = (value: { [key: string]: any }[], i18n: HandlerI18NContext["i18n"]) => {
    // Let's make current locale's value the first element of the array.
    if (value.length < 2) {
        return value;
    }

    const currentLocale = i18n.getCurrentLocale();
    const currentLocaleItemIndex = value.findIndex(item => item.locale === currentLocale.id);

    const output = [...value];
    const [currentLocaleItem] = output.splice(currentLocaleItemIndex, 1);

    output.unshift(currentLocaleItem);

    return output;
};

type I18NValues = { [key: string]: any }[];

export const i18nField = ({
    field = null,
    createField = null,
    context: { i18n, commodo },
    name,
    ...rest
}: I18NField) => {
    const { id } = commodo.fields;

    const ValuesModel = withFields(valuesModel => ({
        locale: id({ validation: validation.create("required") }),
        value: typeof createField === "function" ? createField(valuesModel) : field
    }))();

    const i18nFields = fields({
        ...rest,
        value: {},
        instanceOf: pipe(
            name ? withName(name) : model => model,
            withFields({
                values: onGet(value => getI18NValueItem(value, i18n))(
                    fields({
                        list: true,
                        value: [],
                        instanceOf: ValuesModel
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
                        locale = i18n.getCurrentLocale();
                    }

                    const value = this.values.find(value => value.locale === locale.id);
                    return value ? value.value : undefined;
                }
            })
        )()
    });

    return withProps(instance => {
        return {
            isDirty() {
                return this.state.dirty;
            },
            isDifferentFrom(newValue) {
                if (newValue === null || instance.current === null) {
                    return true;
                }

                return !isEqual(getRawData(instance.current), getRawData(newValue));
            }
        };
    })(i18nFields);
};
