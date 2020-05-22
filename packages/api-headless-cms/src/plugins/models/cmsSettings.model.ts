import { flow } from "lodash";
import {
    withFields,
    setOnce,
    string,
    fields,
    boolean,
    withName,
    withStaticProps
} from "@webiny/commodo";

const SETTINGS_KEY = "cms";

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
                    installed: boolean()
                })()
            })
        })
    )(createBase());
};
