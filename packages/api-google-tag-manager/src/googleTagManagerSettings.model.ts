import { flow } from "lodash";
import {
    withFields,
    setOnce,
    string,
    boolean,
    fields,
    withName,
    withStaticProps
} from "@webiny/commodo";

const SETTINGS_KEY = "google-tag-manager";

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
                instanceOf: withFields({
                    enabled: boolean(),
                    code: string()
                })()
            })
        })
    )(createBase());
};
