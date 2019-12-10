// @flow
import { flow } from "lodash";
import got from "got";
import {
    withFields,
    string,
    number,
    date,
    fields,
    withProps,
    withName,
    withStaticProps,
    skipOnPopulate
} from "@webiny/commodo";

const DEFAULT_TTL_SECONDS = 60;
const DEFAULT_REFRESH_TTL_SECONDS = 30;
const BASE_URL = "https://d2ulm64isck60w.cloudfront.net/ssr";

export default ({ createBase }) => {
    return flow(
        withName("SsrCache"),
        withFields({
            key: string({
                validation(value) {
                    if (!value) {
                        throw new Error(`SsrCache entry's "path" field is required.`);
                    }

                    if (!value.startsWith("/")) {
                        throw new Error(
                            `SsrCache entry's "path" field must begin with forward slash ("/")`
                        );
                    }
                }
            }),
            content: string({ value: null }),
            refreshedOn: skipOnPopulate()(date()),
            expiresOn: skipOnPopulate()(date()),
            lastRefresh: fields({
                value: {},
                instanceOf: flow(
                    withProps({
                        get duration() {
                            return this.end - this.start;
                        }
                    }),
                    withFields({
                        start: date(),
                        end: date(),
                        duration: number()
                    })
                )()
            })
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
            get isEmpty() {
                return !this.hasContent;
            },
            get expiresIn() {
                if (!this.expiresOn) {
                    return 0;
                }

                const expiresIn = this.expiresOn - new Date();
                return expiresIn > 0 ? expiresIn : 0;
            },
            incrementExpiresOn(seconds = DEFAULT_REFRESH_TTL_SECONDS) {
                this.expiresOn = new Date();
                this.expiresOn.setSeconds(this.expiresOn.getSeconds() + seconds);
                return this;
            },
            async refresh() {
                this.lastRefresh.start = new Date();
                await this.save();
                const response = await got(BASE_URL + this.key, {
                    method: "get"
                });
                this.content = response.body;

                this.lastRefresh.end = new Date();
                this.lastRefresh.duration = this.lastRefresh.end - this.lastRefresh.start;
                this.refreshedOn = new Date();
                this.incrementExpiresOn(DEFAULT_TTL_SECONDS);

                await this.save();
            },
            invalidate() {
                this.expiresOn = null;
                return this;
            }
        })
    )(createBase());
};
