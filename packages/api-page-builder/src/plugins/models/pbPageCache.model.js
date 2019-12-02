// @flow
import { flow } from "lodash";
import { withFields, string, date, withProps, withName, withStaticProps } from "@webiny/commodo";

import got from "got";
import get from "lodash.get";

// In future versions, we could load this from page builder / page settings.
const SSR_TTL_SECONDS = 30;

export default ({ createBase, PbSettings }) => {
    return flow(
        withName("PbPageCache"),
        withFields({
            path: string({
                validation(value) {
                    if (!value) {
                        throw new Error(`PbPageCache's "path" field is required.`);
                    }

                    if (!value.startsWith("/")) {
                        throw new Error(
                            `PbPageCache's "path" field must begin with forward slash ("/")`
                        );
                    }
                }
            }),
            content: string({ value: null }),
            refreshedOn: date(),
            expiresOn: date()
        }),
        withStaticProps({
            findByPath(path) {
                return this.findOne({ query: { path } });
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
                const settings = await PbSettings.load();
                const domain = get(settings, "data.domain");
                const content = await got(domain + this.path, {
                    method: "get",
                    headers: {
                        "X-Pb-Ssr": 1
                    }
                });

                this.content = content.body;

                this.refreshedOn = new Date();
                this.expiresOn = new Date();
                this.expiresOn.setSeconds(this.expiresOn.getSeconds() + SSR_TTL_SECONDS);
            }
        })
    )(createBase());
};
