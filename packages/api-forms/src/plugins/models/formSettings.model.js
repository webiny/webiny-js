// @flow
import { flow } from "lodash";
import { validation } from "@webiny/validation";
import {
    withFields,
    setOnce,
    string,
    fields,
    boolean,
    withName,
    withStaticProps
} from "@webiny/commodo";

const SETTINGS_KEY = "forms";

export default ({ createBase }) => {
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
                instanceOf: withFields({
                    reCaptcha: fields({
                        instanceOf: withFields({
                            enabled: boolean(),
                            siteKey: string({ validation: validation.create("maxLength:100") }),
                            secretKey: string({ validation: validation.create("maxLength:100") })
                        })()
                    })
                })()
            })
        })
    )(createBase());
};
