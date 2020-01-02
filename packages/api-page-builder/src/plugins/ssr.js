import { withHooks } from "@webiny/commodo";
import got from "got";

export default [
    {
        // After a page was published, we want just make a simple request, so that the cache is immediately ready.
        type: "extend-models",
        name: "extend-models-invalidate-ssr-cache-after-publish-version-one",
        extend({ PbPage }) {
            withHooks({
                async afterPublish() {
                    if (this.version === 1) {
                        try {
                            await got(await this.fullUrl, {
                                method: "GET",
                                timeout: 100,
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
    // ----------------- separate package
    {
        // After a page was published, we want just make a simple request, so that the cache is immediately ready.
        type: "extend-models",
        name: "extend-models-invalidate-ssr-cache-after-publish-version-gt-one",
        extend({ PbPage }) {
            withHooks({
                async afterPublish() {
                    if (this.version > 1) {
                        try {
                            await got(await this.fullUrl, {
                                method: "DELETE",
                                timeout: 100,
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
        // After a page was published, we want to invalidate caches that contain pages list element.
        type: "extend-models",
        name: "extend-models-invalidate-ssr-cache-after-publish-pages-list",
        extend({ PbPage, PbSettings }) {
            withHooks({
                async afterPublish() {
                    const removeCallback = this.registerHookCallback("afterSave", async () => {
                        try {
                            const settings = await PbSettings.load();
                            await got(settings.data.domain, {
                                method: "DELETE",
                                timeout: 100,
                                retry: 0,
                                body: JSON.stringify({
                                    tags: [{ class: "pb-pages-list" }]
                                })
                            });
                        } catch {
                            // Do nothing.
                        } finally {
                            removeCallback();
                        }
                    });
                }
            })(PbPage);
        }
    },
    {
        // After settings were changed, invalidate all pages that contain pb-settings tag.
        type: "extend-models",
        name: "extend-models-invalidate-ssr-cache-settings",
        extend({ PbSettings }) {
            withHooks({
                beforeSave() {
                    if (!this.isDirty()) {
                        return;
                    }

                    const removeCallback = this.registerHookCallback("afterSave", async () => {
                        try {
                            await got(this.data.domain, {
                                method: "DELETE",
                                timeout: 100,
                                retry: 0,
                                body: JSON.stringify({
                                    tags: [{ class: "pb-settings" }]
                                })
                            });
                        } catch {
                            // Do nothing.
                        } finally {
                            removeCallback();
                        }
                    });
                }
            })(PbSettings);
        }
    },
    {
        type: "extend-models",
        name: "extend-models-pb-menu-invalidate-ssr-cache-cache-menu",
        extend({ PbMenu, PbSettings }) {
            // If the menu has changed, we need to delete page caches.
            withHooks({
                async beforeSave() {
                    // If menus structure has changed, we need to invalidate SSR caches that contain this menu.
                    if (this.isDirty()) {
                        const removeCallback = this.registerHookCallback("afterSave", async () => {
                            try {
                                const settings = await PbSettings.load();
                                await got(settings.data.domain, {
                                    method: "DELETE",
                                    timeout: 100,
                                    retry: 0,
                                    body: JSON.stringify({
                                        tags: [{ class: "pb-menu", id: this.slug }]
                                    })
                                });
                            } catch {
                                // Do nothing.
                            } finally {
                                removeCallback();
                            }
                        });
                    }
                }
            })(PbMenu);
        }
    }
];
