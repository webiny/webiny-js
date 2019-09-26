// @flow
import { flow } from "lodash";
import { validation } from "@webiny/validation";
import {
    withFields,
    setOnce,
    string,
    boolean,
    fields,
    withName,
    withStaticProps
} from "@webiny/commodo";

const SETTINGS_KEY = "cookie-policy";

export default ({ createBase }) => {
    const ColorsModel = withFields({
        background: string(),
        text: string()
    })();

    return flow(
        withName("Settings"),
        withStaticProps({
            async load() {
                return await this.findOne({ query: { key: SETTINGS_KEY } });
            }
        }),
        withFields({
            key: setOnce()(string({ value: SETTINGS_KEY })),
            data: fields({
                list: true,
                instanceOf: withFields({
                    enabled: boolean(),
                    position: string({
                        value: "bottom",
                        validation: validation.create("in:bottom:top:bottom-left:bottom-right")
                    }),
                    palette: fields({
                        instanceOf: withFields({
                            popup: fields({ instanceOf: ColorsModel }),
                            button: fields({ instanceOf: ColorsModel })
                        })()
                    }),
                    content: fields({
                        instanceOf: withFields({
                            href: string(),
                            message: string(),
                            dismiss: string(),
                            link: string()
                        })()
                    })
                })()
            })
        })
    )(createBase());
};
