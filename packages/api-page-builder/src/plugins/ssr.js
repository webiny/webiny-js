import { withHooks } from "@webiny/commodo";
import got from "got";

export default [
    {
        type: "extend-models",
        name: "extend-models-pb-page-after-publish",
        extend({ PbPage }) {
            withHooks({
                async afterPublish() {
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
            })(PbPage);
        }
    },
    // ----------------- separate package
    {
        type: "extend-models",
        name: "extend-models-pb-menu-delete-cache-on-change",
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
