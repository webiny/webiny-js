import lodashGet from "lodash/get";
import merge from "lodash/merge";
import trimStart from "lodash/trimStart";
import trimEnd from "lodash/trimEnd";
import WebinyError from "@webiny/error";
import { Args as PsFlushParams } from "@webiny/api-prerendering-service/flush/types";
import { Args as PsRenderParams } from "@webiny/api-prerendering-service/render/types";
import { Args as PsQueueAddParams } from "@webiny/api-prerendering-service/queue/add/types";
import { ContextPlugin } from "@webiny/handler";
import { PbContext } from "~/graphql/types";

export const prerenderingHandlers = new ContextPlugin<PbContext>(context => {
    context.pageBuilder.setPrerenderingHandlers({
        async render(args): Promise<void> {
            const { paths, tags, context, queue = false } = args;

            const current = await context.pageBuilder.getCurrentSettings();
            const appUrl = lodashGet(current, "prerendering.app.url");
            const storageName = lodashGet(current, "prerendering.storage.name");

            if (!appUrl || !storageName) {
                return;
            }

            const locale = context.i18n.getContentLocale();

            if (!locale || !locale.code) {
                console.log("Missing content locale on context.i18n.");
                return;
            }

            const currentPrerenderingMeta = lodashGet(current, "prerendering.meta");

            const meta = merge({}, currentPrerenderingMeta || {}, {
                tenant: context.tenancy.getCurrentTenant().id,
                locale: locale.code
            });

            const dbNamespace = "T#" + context.tenancy.getCurrentTenant().id;

            if (Array.isArray(paths)) {
                const render = paths.map<PsRenderParams>(item => ({
                    url: trimEnd(appUrl + item.path, "/"),
                    path: item.path,
                    configuration: merge(
                        {},
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
                }));

                try {
                    await context.pageBuilder.onPageBeforeRender.publish({
                        paths,
                        args: { render }
                    });

                    if (queue) {
                        for (const renderItem of render) {
                            await context.prerenderingServiceClient.queue.add({
                                render: renderItem
                            });
                        }
                    } else {
                        await context.prerenderingServiceClient.render(render);
                    }

                    await context.pageBuilder.onPageAfterRender.publish({
                        paths,
                        args: { render }
                    });
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
                    const queue = tags.map<PsQueueAddParams>(item => ({
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
                    }));
                    await context.pageBuilder.onPageBeforeRender.publish({
                        tags,
                        args: { queue }
                    });
                    await context.prerenderingServiceClient.queue.add(queue);
                    await context.pageBuilder.onPageAfterRender.publish({
                        tags,
                        args: { queue }
                    });
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

        async flush(args): Promise<void> {
            const { context } = args;

            const current = await context.pageBuilder.getCurrentSettings();
            const appUrl = lodashGet(current, "prerendering.app.url");
            const storageName = lodashGet(current, "prerendering.storage.name");

            if (!storageName) {
                return;
            }

            const { paths, tags } = args;

            const dbNamespace = "T#" + context.tenancy.getCurrentTenant().id;

            if (Array.isArray(paths)) {
                const flush = paths.map<PsFlushParams>(item => ({
                    url: trimEnd(appUrl + item.path, "/"),
                    path: item.path,
                    // Configuration is mainly static (defined here), but some configuration
                    // overrides can arrive via the call args, so let's do a merge here.
                    configuration: merge(
                        {
                            db: {
                                namespace: dbNamespace
                            }
                        },
                        item.configuration
                    )
                }));

                await context.pageBuilder.onPageBeforeFlush.publish({ paths, args: { flush } });
                await context.prerenderingServiceClient.flush(flush);
                await context.pageBuilder.onPageAfterFlush.publish({ paths, args: { flush } });
            }

            if (Array.isArray(tags)) {
                const queue = tags.map<PsQueueAddParams>(item => ({
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
                }));

                await context.pageBuilder.onPageBeforeFlush.publish({ tags, args: { queue } });
                await context.prerenderingServiceClient.queue.add(queue);
                await context.pageBuilder.onPageAfterFlush.publish({ tags, args: { queue } });
            }
        }
    });
});
