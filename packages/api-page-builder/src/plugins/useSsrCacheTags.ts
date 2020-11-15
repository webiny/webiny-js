import { withHooks } from "@webiny/commodo";
import SsrApiClient from "@webiny/handler-ssr/Client";
import gql from "graphql-tag";
import { hasScope } from "@webiny/api-security";
import { Response, ErrorResponse, NotFoundResponse } from "@webiny/graphql/responses";

export default () => [
    {
        type: "context",
        name: "context-ssr-cache-client",
        async apply(context) {
            const { PbSettings } = context.models;
            if (!PbSettings) {
                throw new Error(
                    `Cannot apply useSsrCacheTags set of plugins, make sure they are registered after the base api-page-builder plugins.`
                );
            }

            context.__ssrApiClient = null;
            context.getSsrApiClient = async () => {
                if (!context.__ssrApiClient) {
                    const settings = await PbSettings.load();
                    context.__ssrApiClient = new SsrApiClient({ url: settings.data.domain });
                }
                return context.__ssrApiClient;
            };
        }
    },
    {
        // After a page was published, we want to invalidate the SSR cache.
        type: "context",
        name: "context-extend-pb-page-invalidate-ssr-cache-on-publish-gt-1",
        apply({ getSsrApiClient, models: { PbPage } }) {
            withHooks({
                async afterPublish() {
                    if (this.version > 1) {
                        const ssrApiClient = await getSsrApiClient();
                        await ssrApiClient.invalidateSsrCacheByPath({
                            path: this.url,
                            refresh: true
                        });

                        // If the page is set as site's homepage, we need to invalidate the "/" path too.
                        if (await this.isHomePage) {
                            await ssrApiClient.invalidateSsrCacheByPath({
                                path: "/",
                                refresh: true
                            });
                        }
                    }
                }
            })(PbPage);
        }
    },
    {
        // After a page was published, we want to invalidate caches that contain pages list element.
        type: "context",
        name: "context-extend-pb-page-invalidate-ssr-cache-after-publish-pages-list",
        apply({ getSsrApiClient, models: { PbPage } }) {
            withHooks({
                async afterPublish() {
                    const ssrApiClient = await getSsrApiClient();
                    await ssrApiClient.invalidateSsrCacheByTags({
                        tags: [{ class: "pb-pages-list" }]
                    });
                }
            })(PbPage);
        }
    },
    {
        // After settings were changed, invalidate all pages that contain pb-page tag.
        type: "context",
        name: "context-extend-pb-page-invalidate-ssr-cache-settings",
        apply({ getSsrApiClient, models: { PbSettings } }) {
            withHooks({
                beforeSave() {
                    // Avoid calling this callback while the Page Builder is installing and multiple save commands are issued.
                    if (!this.data.installation.completed) {
                        return;
                    }

                    if (!this.isDirty()) {
                        return;
                    }

                    const removeCallback = this.hook("afterSave", async () => {
                        try {
                            const ssrApiClient = await getSsrApiClient();
                            await ssrApiClient.invalidateSsrCacheByTags({
                                tags: [{ class: "pb-page" }]
                            });
                        } catch {
                            // Do nothing.
                        }
                        removeCallback();
                    });
                }
            })(PbSettings);
        }
    },
    {
        // After settings were changed, invalidate all pages that contain pb-menu tag.
        type: "context",
        name: "context-extend-pb-page-pb-menu-invalidate-ssr-cache-cache-menu",
        apply({ getSsrApiClient, models: { PbMenu } }) {
            // If the menu has changed, we need to delete page caches.
            withHooks({
                async beforeSave() {
                    // If menus structure has changed, we need to invalidate SSR caches that contain this menu.
                    if (this.isDirty()) {
                        const removeCallback = this.hook("afterSave", async () => {
                            try {
                                const ssrApiClient = await getSsrApiClient();
                                await ssrApiClient.invalidateSsrCacheByTags({
                                    tags: [{ class: "pb-menu", id: this.slug }]
                                });
                            } catch {
                                // Do nothing.
                            }
                            removeCallback();
                        });
                    }
                }
            })(PbMenu);
        }
    },
    {
        // After successful installation, GET requests will be issued to initially installed pages.
        // This is fine, but if a user visited the homepage first (without going straight to "/admin", which is
        // a frequent case), that page will get cached unfortunately, and we need to invalidate it. There could be
        // of course more pages that the user visited before entering admin, for now we'll just focus on the homepage.
        type: "pb-install",
        name: "pb-install-invalidate-previous-homepage-cache",
        async after({ data }) {
            // Although we had client registered above, it's not ready yet because domain wasn't
            // set in PbSettings instance. That's why we just take the domain from the received args.
            const ssrApiClient = new SsrApiClient({ url: data.domain });
            await ssrApiClient.invalidateSsrCacheByPath({
                path: "/",
                refresh: true
            });
        }
    },
    {
        name: "graphql-schema-page-builder-use-ssr-cache-tags",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                extend type PbMutation {
                    # Refreshes SSR cache for current page. The page must be published.
                    invalidateSsrCache(revision: ID!, refresh: Boolean): PbPageResponse
                }
            `,
            resolvers: {
                PbMutation: {
                    invalidateSsrCache: hasScope("pb:page:crud")(
                        async (_, args, { models, getSsrApiClient }) => {
                            const { PbPage } = models;
                            const page = await PbPage.findById(args.revision);
                            if (!page) {
                                return new NotFoundResponse(args.revision);
                            }

                            if (!page.published) {
                                return new ErrorResponse({
                                    code: "PB_SSR_CACHE_INVALIDATION_ABORTED",
                                    message: "Cannot refresh SSR cache, revision is not published."
                                });
                            }

                            const ssrApiClient = await getSsrApiClient();
                            await ssrApiClient.invalidateSsrCacheByPath({
                                path: page.url,
                                refresh: args.refresh
                            });

                            return new Response(page);
                        }
                    )
                }
            }
        }
    }
];
