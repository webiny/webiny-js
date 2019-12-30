import { flow } from "lodash";
import LambdaClient from "aws-sdk/clients/lambda";
import getSsrCacheTags from "./ssrCache/getSsrCacheTags";
import {
    withFields,
    string,
    number,
    date,
    fields,
    object,
    withProps,
    withName,
    withHooks,
    withStaticProps,
    skipOnPopulate
} from "@webiny/commodo";

const DEFAULT_CACHE_TTL = 80;
const DEFAULT_STALE_CACHE_TTL = 20;

export default ({ createBase }) => {
    const TTL_CACHE = process.env.CACHE_TTL || DEFAULT_CACHE_TTL;
    const TTL_STALE_CACHE = process.env.STALE_CACHE_TTL || DEFAULT_STALE_CACHE_TTL;

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

                const expiresIn = this.expiresOn - new Date();
                return expiresIn > 0 ? expiresIn : 0;
            },

            incrementExpiresOn(seconds = TTL_STALE_CACHE) {
                this.expiresOn = new Date();
                this.expiresOn.setSeconds(this.expiresOn.getSeconds() + seconds);
                return this;
            },
            async refresh() {
                this.lastRefresh.startedOn = new Date();
                await this.save();

                const Lambda = new LambdaClient({ region: process.env.AWS_REGION });

                const response = await Lambda.invoke({
                    FunctionName: process.env.SSR_FUNCTION,
                    Payload: JSON.stringify({ path: this.path })
                }).promise();

                console.log('resppose', typeof response, response)
                const Payload = JSON.parse(response.Payload);
                this.content = Payload.body;

                this.lastRefresh.endedOn = new Date();
                this.lastRefresh.duration = this.lastRefresh.endedOn - this.lastRefresh.startedOn;
                this.refreshedOn = new Date();
                this.incrementExpiresOn(TTL_CACHE);

                await this.save();
            },
            async invalidate() {
                await this.hook("beforeInvalidate");
                this.expiresOn = null;
                this.content = null;
                this.save();
                await this.hook("afterInvalidate");
            }
        })
    )(createBase());
};
