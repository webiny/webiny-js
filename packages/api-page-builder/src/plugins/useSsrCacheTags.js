import { withHooks } from "@webiny/commodo";
import SsrApiClient from "@webiny/http-handler-ssr/Client";
import gql from "graphql-tag";
import { hasScope } from "@webiny/api-security";
import { Response, ErrorResponse, NotFoundResponse } from "@webiny/api";

export default () => [
    {
        type: "graphql-context",
        name: "graphql-context-ssr-cache-client",
        async apply(context) {
            const { PbSettings } = context.models;
            if (!PbSettings) {
                throw new Error(
                    `Cannot apply useSsrCacheTags set of plugins, make sure they are registered after the base api-page-builder plugins.`
                );
            }

            const settings = await PbSettings.load();
            context.ssrApiClient = new SsrApiClient({ url: settings.data.domain });
        }
    },
    {
        // After a page was published, we want to invalidate the SSR cache.
        type: "graphql-context",
        name: "graphql-context-extend-pb-page-invalidate-ssr-cache-on-publish-gt-1",
        apply({ ssrApiClient, models: { PbPage } }) {
            withHooks({
                async afterPublish() {
                    if (this.version > 1) {
                        await ssrApiClient.invalidateSsrCacheByPath({
                            path: this.url,
                            refresh: true
                        });
                    }
                }
            })(PbPage);
        }
    },
    {
        // After a page was published, we want to invalidate caches that contain pages list element.
        type: "graphql-context",
        name: "graphql-context-extend-pb-page-invalidate-ssr-cache-after-publish-pages-list",
        apply({ ssrApiClient, models: { PbPage } }) {
            withHooks({
                async afterPublish() {
                    await ssrApiClient.invalidateSsrCacheByTags({
                        tags: [{ class: "pb-pages-list" }]
                    });
                }
            })(PbPage);
        }
    },
    {
        // After settings were changed, invalidate all pages that contain pb-settings tag.
        type: "graphql-context",
        name: "graphql-context-extend-pb-page-invalidate-ssr-cache-settings",
        apply({ ssrApiClient, models: { PbSettings } }) {
            withHooks({
                beforeSave() {
                    if (!this.isDirty()) {
                        return;
                    }

                    const removeCallback = this.hook("afterSave", async () => {
                        try {
                            await ssrApiClient.invalidateSsrCacheByTags({
                                tags: [{ class: "pb-settings" }]
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
        type: "graphql-context",
        name: "graphql-context-extend-pb-page-pb-menu-invalidate-ssr-cache-cache-menu",
        apply({ ssrApiClient, models: { PbMenu } }) {
            // If the menu has changed, we need to delete page caches.
            withHooks({
                async beforeSave() {
                    // If menus structure has changed, we need to invalidate SSR caches that contain this menu.
                    if (this.isDirty()) {
                        const removeCallback = this.hook("afterSave", async () => {
                            try {
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
                    invalidateSsrCache: async (_, args, { models, ssrApiClient }) => {
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

                        await ssrApiClient.invalidateSsrCacheByPath({
                            path: page.url,
                            refresh: args.refresh
                        });

                        return new Response(page);
                    }
                }
            }
        },
        security: {
            shield: {
                PbMutation: {
                    invalidateSsrCache: hasScope("pb:page:crud")
                }
            }
        }
    }
];
