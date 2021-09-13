import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { PbContext } from "~/graphql/types";
import WebinyError from "@webiny/error";
import lodashGet from "lodash/get";
import merge from "lodash/merge";
import trimStart from "lodash/trimStart";
import { Args as FlushArgs } from "@webiny/api-prerendering-service/flush/types";
import prerenderingPlugins from "./plugins";

/**
 * We need to hook up the prerendering to our app, so just register this context plugin.
 */
export default () => {
    return new ContextPlugin<PbContext>(async context => {
        context.plugins.register(prerenderingPlugins());
        /**
         * Overwrite the existing prerendering.
         * We do not need prerendering in all deployments so users can import and register the plugin when required.
         */
        context.pageBuilder.pages.prerendering = {
            async render(args) {
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

                const { paths, tags } = args;

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
            },
            async flush(args) {
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
        };
    });
};
