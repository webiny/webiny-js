// @flow
import { flow } from "lodash";
import {
    withFields,
    string,
    date,
    withProps,
    withName,
    withStaticProps,
    skipOnPopulate
} from "@webiny/commodo";
import { validation } from "@webiny/validation";
import got from "got";

const DEFAULT_TTL_SECONDS = 30;

export default ({ createBase }) => {
    return flow(
        withName("Cache"),
        withFields({
            key: string({
                validation: validation.create("required")
            }),
            content: string({ value: null }),
            refreshedOn: skipOnPopulate()(date()),
            expiresOn: skipOnPopulate()(date())
        }),
        withStaticProps({
            findByKey(key) {
                return this.findOne({ query: { key } });
            }
        }),
        withProps({
            get hasExpired() {
                return this.expiresIn === 0;
            },
            get hasContent() {
                return typeof this.content === "string" && this.content.length > 0;
            },
            get expiresIn() {
                if (!this.expiresOn) {
                    return 0;
                }

                const expiresIn = this.expiresOn - new Date();
                return expiresIn > 0 ? expiresIn : 0;
            },
            async refresh() {
                const instance = this;
                /*if (instance.key.startsWith("ssr://")) {
                    const url = instance.key.replace("ssr://", "");
                    const content = await got(url, {
                        method: "get",
                        headers: {
                            "X-Ssr-Html": 1
                        }
                    });

                    instance.content = content.body;
                }*/

                this.content = 'bujakaa';
                this.refreshedOn = new Date();
                this.expiresOn = new Date();
                this.expiresOn.setSeconds(this.expiresOn.getSeconds() + DEFAULT_TTL_SECONDS);
            },
            invalidate() {
                this.expiresOn = null;
                return this;
            }
        })
    )(createBase());
};
