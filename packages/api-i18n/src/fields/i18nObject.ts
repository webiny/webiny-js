import { flow } from "lodash";
import { onGet, object, fields, withFields, withProps } from "@webiny/commodo";
import { validation } from "@webiny/validation";
import { GraphQLContext as CommodoContext } from "@webiny/api-plugin-commodo-db-proxy/types";
import { GraphQLContext as I18NContext } from "@webiny/api-i18n/types";
import onGetI18NValues from "./onGetI18NValues";

export type I18NObject = {
    context: CommodoContext & I18NContext;
    [key: string]: any;
};

export default ({ context: { i18n, commodo }, ...rest }: I18NObject) => {
    const { id } = commodo.fields;

    return fields({
        ...rest,
        value: {},
        instanceOf: flow(
            withFields({
                values: onGet(value => onGetI18NValues(value, i18n))(
                    fields({
                        list: true,
                        value: [],
                        instanceOf: withFields({
                            locale: id({ validation: validation.create("required") }),
                            value: object()
                        })()
                    })
                )
            }),
            withProps({
                get value() {
                    const locale = i18n.getLocale();
                    const value = this.values.find(value => value.locale === locale.id);
                    return value ? value.value : "";
                }
            })
        )()
    });
};
