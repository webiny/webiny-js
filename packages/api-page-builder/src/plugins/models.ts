import { flow } from "lodash";
import { withStorage, withCrudLogs, withSoftDelete, withFields, withHooks } from "@webiny/commodo";
import { withUser } from "@webiny/api-security";
import pbCategory from "./models/pbCategory.model";
import pbPageElement from "./models/pbPageElement.model";
import pbMenu from "./models/pbMenu.model";
import pbPage from "./models/pbPage.model";
import pbSettings from "./models/pbSettings.model";
import got from "got";

export default () => [
    {
        name: "graphql-context-models",
        type: "graphql-context",
        apply(context) {
            const driver = context.commodo && context.commodo.driver;

            if (!driver) {
                throw Error(
                    `Commodo driver is not configured! Make sure you add a Commodo driver plugin to your service.`
                );
            }

            const createBase = ({ maxPerPage = 100 } = {}) =>
                flow(
                    withFields({
                        id: context.commodo.fields.id()
                    }),
                    withStorage({ driver, maxPerPage }),
                    withUser(context),
                    withSoftDelete(),
                    withCrudLogs()
                )();

            const PbCategory = pbCategory({ createBase });
            const PbMenu = pbMenu({ createBase });
            const PbPageElement = pbPageElement({ createBase, context });
            const PbSettings = pbSettings({ createBase, context });
            const PbPage = pbPage({ createBase, context, PbCategory, PbSettings });

            context.models = {
                PbCategory,
                PbPageElement,
                PbMenu,
                PbSettings,
                PbPage,
                createBase
            };
        }
    },
    {
        // After a page was published, we want just make a simple request, so that the cache is immediately ready.
        // Note that we assume that SSR caching is enabled on the lambda that is serving the site, because the
        // chances are very high that it will be enabled.
        type: "graphql-context",
        name: "graphql-context-pb-page-refresh-ssr-cache-on-initial-publish",
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
