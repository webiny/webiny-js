import { FlushParams, PrerenderingPagePlugin } from "~/plugins/PrerenderingPagePlugin";
import lodashGet from "lodash/get";
import merge from "lodash/merge";
import trimStart from "lodash/trimStart";
import WebinyError from "@webiny/error";
import { Args as FlushArgs } from "@webiny/api-prerendering-service/flush/types";

export class PrerenderingPagePluginImpl extends PrerenderingPagePlugin {
    public async render(args): Promise<void> {
        const { paths, tags, context } = args;

        const current = await context.pageBuilder.settings.getCurrent();
        const appUrl = lodashGet(current, "prerendering.app.url");
        const storageName = lodashGet(current, "prerendering.storage.name");

        if (!appUrl || !storageName) {
            return;
        }

        const currentPrerenderingMeta = lodashGet(current, "prerendering.meta");

        const meta = merge(currentPrerenderingMeta || {}, {
            tenant: context.tenancy.getCurrentTenant().id,
            locale: context.i18nContent.getLocale().code
        });

        const dbNamespace = "T#" + context.tenancy.getCurrentTenant().id;

        if (Array.isArray(paths)) {
            try {
                await context.prerenderingServiceClient.render(
                    paths.map(item => ({
                        url: appUrl + item.path,
                        configuration: merge(
                            {
                                meta,
                                storage: {
                                    folder: trimStart(item.path, "/"),
                                    name: storageName
                                },
                                db: {
                                    namespace: dbNamespace
                                }
                            },
                            item.configuration
                        )
                    }))
                );
            } catch (ex) {
                throw new WebinyError(
                    ex.message ||
                        "Could not render given paths via the prerendering service client.",
                    ex.code || "PRERENDERING_SERVICE_CLIENT_RENDER_ERROR",
                    {
                        meta,
                        dbNamespace,
                        storageName,
                        paths
                    }
                );
            }
        }

        if (Array.isArray(tags)) {
            try {
                await context.prerenderingServiceClient.queue.add(
                    tags.map(item => ({
                        render: {
                            tag: item.tag,
                            configuration: merge(
                                {
                                    db: {
                                        namespace: dbNamespace
                                    }
                                },
                                item.configuration
                            )
                        }
                    }))
                );
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not add tags to prerendering service queue.",
                    ex.code || "PRERENDERING_SERVICE_CLIENT_QUEUE_ERROR",
                    {
                        meta,
                        dbNamespace,
                        tags
                    }
                );
            }
        }
    }

    public async flush(args: FlushParams): Promise<void> {
        const { context } = args;

        const current = await context.pageBuilder.settings.getCurrent();
        const appUrl = lodashGet(current, "prerendering.app.url");
        const storageName = lodashGet(current, "prerendering.storage.name");

        if (!storageName) {
            return;
        }

        const { paths, tags } = args;

        const dbNamespace = "T#" + context.tenancy.getCurrentTenant().id;

        if (Array.isArray(paths)) {
            await context.prerenderingServiceClient.flush(
                paths.map<FlushArgs>(p => ({
                    url: appUrl + p.path,
                    // Configuration is mainly static (defined here), but some configuration
                    // overrides can arrive via the call args, so let's do a merge here.
                    configuration: merge(
                        {
                            db: {
                                namespace: dbNamespace
                            }
                        },
                        p.configuration
                    )
                }))
            );
        }

        if (Array.isArray(tags)) {
            await context.prerenderingServiceClient.queue.add(
                tags.map(item => ({
                    flush: {
                        tag: item.tag,
                        configuration: merge(
                            {
                                db: {
                                    namespace: dbNamespace
                                }
                            },
                            item.configuration
                        )
                    }
                }))
            );
        }
    }
}
