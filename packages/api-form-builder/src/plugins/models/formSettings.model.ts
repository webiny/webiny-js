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
                let settings = await this.findOne({ query: { key: SETTINGS_KEY } });
                if (!settings) {
                    settings = new this();
                    await settings.save();
                }
                return settings;
            }
        }),
        withFields({
            key: setOnce()(string({ value: SETTINGS_KEY })),
            data: fields({
                value: {},
                instanceOf: withFields({
                    installed: boolean(),
                    domain: string(),
                    reCaptcha: fields({
                        value: {},
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
