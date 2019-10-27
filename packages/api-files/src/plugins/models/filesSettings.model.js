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
    onSet
} from "@webiny/commodo";
import { validation } from "@webiny/validation";

const SETTINGS_KEY = "files";

export default ({ createBase }) => {
    const FilesSettings = flow(
        withName("Settings"),
        withStaticProps({
            async load() {
                let settings = await this.findOne({ query: { key: SETTINGS_KEY } });
                if (!settings) {
                    settings = new FilesSettings();
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
                    srcPrefix: onSet(value => {
                        // Make sure srcPrefix always ends with forward slash.
                        if (typeof value === "string") {
                            return value.endsWith("/") ? value : value + "/";
                        }
                        return value;
                    })(
                        string({
                            validation: validation.create("required"),
                            value: "/files/"
                        })
                    )
                })()
            })
        })
    )(createBase());

    return FilesSettings;
};
