// @flow
import { flow } from "lodash";
import MailchimpApi from "./MailchimpApi";

import {
    withFields,
    setOnce,
    onSet,
    string,
    boolean,
    fields,
    withName,
    withStaticProps
} from "@webiny/commodo";

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
                            instance.registerHookCallback("beforeSave", async () => {
                                console.log("TODO: setOnce");

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
