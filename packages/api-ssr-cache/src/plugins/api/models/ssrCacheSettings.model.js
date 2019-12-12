// @flow
import { flow } from "lodash";
import {
    withStaticProps,
    withName,
    string,
    boolean,
    fields,
    withFields,
    setOnce,
} from "@webiny/commodo";
import { validation } from "@webiny/validation";

const SETTINGS_KEY = "ssr-cache";

export default ({ createBase }) => {
    const SsrCacheSettings = flow(
        withName("Settings"),
        withStaticProps({
            async load() {
                let settings = await this.findOne({ query: { key: SETTINGS_KEY } });
                if (!settings) {
                    settings = new SsrCacheSettings();
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
                    installed: boolean({ value: false }),
                    ssrGenerationUrl: string({
                        validation: validation.create("url")
                    })
                })()
            })
        })
    )(createBase());

    return SsrCacheSettings;
};
