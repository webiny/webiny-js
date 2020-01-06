import { withHooks } from "@webiny/commodo";
import SsrApiClient from "@webiny/cloud-function-ssr/Client";

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
                    const removeCallback = this.registerHookCallback("afterSave", async () => {
                        try {
                            await ssrApiClient.invalidateSsrCacheByTags({
                                tags: [{ class: "pb-pages-list" }]
                            });
                        } catch {
                            // Do nothing.
                        }
                        removeCallback();
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

                    const removeCallback = this.registerHookCallback("afterSave", async () => {
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
                        const removeCallback = this.registerHookCallback("afterSave", async () => {
                            try {
                                await ssrApiClient.invalidateSsrCacheByTags({
                                    tags: [{ class: "pb-menu" }]
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
    }
];
