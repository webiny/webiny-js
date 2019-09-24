// @flow
import { flow } from "lodash";
import { withFields, setOnce } from "@commodo/fields";
import { string, boolean, fields } from "@commodo/fields/fields";
import { withName } from "@commodo/name";
import { withStaticProps } from "repropose";

const SETTINGS_KEY = "google-tag-manager";

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
                    enabled: boolean(),
                    code: string()
                })()
            })
        })
    )(createBase());
};
