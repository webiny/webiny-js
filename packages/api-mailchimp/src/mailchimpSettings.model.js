// @flow
import { flow } from "lodash";
import { withFields, setOnce, onSet } from "@commodo/fields";
import { string, boolean, fields } from "@commodo/fields/fields";
import { withName } from "@commodo/name";
import { withStaticProps } from "repropose";
import MailchimpApi from "./MailchimpApi";

const SETTINGS_KEY = "mailchimp";

export default ({ createBase }) => {
    return flow(
        withName("Settings"),
        withStaticProps({
            async load() {
                return await this.findOne({ query: { key: SETTINGS_KEY } });
            }
        }),
        withFields(instance => ({
            key: setOnce()(string({ value: SETTINGS_KEY })),
            data: fields({
                instanceOf: withFields({
                    enabled: boolean(),
                    apiKey: onSet(value => {
                        if (value && value !== instance.apiKey) {
                            const remove = instance.registerHookCallback("beforeSave", async () => {

                                const mailchimp = new MailchimpApi({ apiKey: value });
                                const valid = await mailchimp.isValidApiKey();
                                if (!valid) {
                                    throw Error("API key invalid.");
                                }
                            });
                        }
                        return value;
                    })(string())
                })()
            })
        }))
    )(createBase());
};
