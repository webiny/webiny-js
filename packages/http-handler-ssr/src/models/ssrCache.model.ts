import flow from "lodash.flow";
import getSsrCacheTags from "./ssrCache/getSsrCacheTags";
import { withFields, string, number, fields, skipOnPopulate } from "@webiny/commodo/fields";
import { withProps, withStaticProps } from "@webiny/commodo/repropose";
import { date } from "@webiny/commodo/fields-date";
import { object } from "@webiny/commodo/fields-object";
import { withName } from "@webiny/commodo/name";
import { withHooks } from "@webiny/commodo/hooks";
import { getSsrHtml } from "@webiny/http-handler-ssr/functions";

export default ({ createBase, options = {} }: any = {}) =>
    flow(
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
            cacheTags: skipOnPopulate()(object({ list: true })),
            lastRefresh: skipOnPopulate()(
                fields({
                    value: {},
                    instanceOf: flow(
                        withProps({
                            get duration() {
                                return this.endedOn - this.startedOn;
                            }
                        }),
                        withFields({
                            startedOn: date(),
                            endedOn: date(),
                            duration: number()
                        })
                    )()
                })
            )
        }),
        withHooks({
            beforeSave() {
                this.cacheTags = getSsrCacheTags(this.content);
            }
        }),
        withStaticProps({
            findByPath(path) {
                return this.findOne({ query: { path } });
            }
        }),
        withProps({
            get hasExpired() {
                return !this.expiresIn;
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

                // @ts-ignore
                const expiresIn = this.expiresOn - new Date();
                return expiresIn > 0 ? expiresIn : 0;
            },

            incrementExpiresOn(seconds = options.cache.staleTtl) {
                this.expiresOn = new Date();
                this.expiresOn.setSeconds(this.expiresOn.getSeconds() + seconds);
                return this;
            },
            async refresh() {
                this.lastRefresh.startedOn = new Date();
                await this.save();

                this.content = await getSsrHtml(options.ssrFunction, { path: this.path });

                this.lastRefresh.endedOn = new Date();
                this.lastRefresh.duration = this.lastRefresh.endedOn - this.lastRefresh.startedOn;
                this.refreshedOn = new Date();
                this.incrementExpiresOn(options.cache.ttl);

                await this.save();
            },
            async invalidate() {
                await this.hook("beforeInvalidate");
                this.expiresOn = null;
                this.content = null;
                await this.save();
                await this.hook("afterInvalidate");
            }
        })
    )(createBase());
