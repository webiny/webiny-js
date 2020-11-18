import { withHooks } from "@webiny/commodo";
import got from "got";

export default () => [
    {
        // After a page was published, we want just make a simple request, so that the cache is immediately ready.
        // Note that we assume that SSR caching is enabled on the lambda that is serving the site, because the
        // chances are very high that it will be enabled.
        type: "context",
        name: "context-pb-page-refresh-ssr-cache-on-initial-publish",
        apply(context) {
            const {
                models: { PbPage }
            } = context;
            withHooks({
                async afterPublish() {
                    if (this.version === 1) {
                        try {
                            await got(await this.fullUrl, {
                                method: "GET",
                                timeout: 200,
                                retry: 0
                            });
                        } catch {
                            // Do nothing.
                        }
                    }
                }
            })(PbPage);
        }
    },
    {
        // After successful installation, GET requests will be issued to all of the initially installed pages.
        // This way, once user visits one of the initially installed pages, he won't have to wait for the background
        // SSR render to finish.
        type: "pb-install",
        name: "pb-install-generate-ssr-via-get-requests",
        async after({ context }) {
            const {
                models: { PbPage }
            } = context;

            // Asynchronously send a GET request to each page so that the SSR cache gets populated.
            const initialPages = await PbPage.find();
            for (let i = 0; i < initialPages.length; i++) {
                const url = await initialPages[i].fullUrl;
                try {
                    await got(url, {
                        timeout: 200,
                        retry: 0
                    });
                } catch {
                    // Do nothing.
                }
            }
        }
    }
];
