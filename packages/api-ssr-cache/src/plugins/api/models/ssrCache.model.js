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

export default ({ createBase, SsrCacheSettings }) => {
    return flow(
        withName("SsrCache"),
        withFields({
            path: string({
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
                const settings = await SsrCacheSettings.load();
                this.lastRefresh.start = new Date();
                await this.save();
                const response = await got(settings.data.ssrGenerationUrl, {
                    headers: { "Content-Type": "application/json" },
                    method: "post",
                    body: JSON.stringify({
                        path: this.path
                    })
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
