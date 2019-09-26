import onGetI18NValues from "./onGetI18NValues";
import { onGet, string, fields, withFields, withProps } from "@webiny/commodo";
import { validation } from "@webiny/validation";
import { flow } from "lodash";
import { id } from "@commodo/fields-storage-mongodb";

export default ({ context: { i18n }, ...rest }) => {
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
                            value: string()
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
