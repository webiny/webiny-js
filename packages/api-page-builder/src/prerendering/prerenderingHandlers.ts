import WebinyError from "@webiny/error";
import { FlushEvent, RenderEvent, QueueAddJob } from "@webiny/api-prerendering-service/types";
import { ContextPlugin } from "@webiny/api";
import { PbContext } from "~/graphql/types";

export const prerenderingHandlers = new ContextPlugin<PbContext>(context => {
    context.pageBuilder.setPrerenderingHandlers({
        async render(args): Promise<void> {
            const { paths, tags, queue = false } = args;

            const locale = context.i18n.getContentLocale();
            const tenant = context.tenancy.getCurrentTenant().id;

            if (!locale || !locale.code) {
                console.log("Missing content locale on context.i18n.");
                return;
            }

            if (Array.isArray(paths)) {
                const render = paths.map<RenderEvent>(item => ({
                    ...item,
                    tenant,
                    locale: locale.code
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
                            tenant,
                            paths
                        }
                    );
                }
            }

            if (Array.isArray(tags)) {
                try {
                    const queue = tags.map<QueueAddJob>(item => ({
                        render: {
                            tag: item.tag,
                            tenant,
                            locale: locale.code
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
                            tenant,
                            tags
                        }
                    );
                }
            }
        },

        async flush(args): Promise<void> {
            const tenant = context.tenancy.getCurrentTenant().id;
            const locale = context.i18n.getContentLocale()!;

            const { paths, tags } = args;

            if (Array.isArray(paths)) {
                const flush = paths.map<FlushEvent>(item => ({
                    path: item.path,
                    locale: locale.code,
                    tenant
                }));

                await context.pageBuilder.onPageBeforeFlush.publish({ paths, args: { flush } });
                await context.prerenderingServiceClient.flush(flush);
                await context.pageBuilder.onPageAfterFlush.publish({ paths, args: { flush } });
            }

            if (Array.isArray(tags)) {
                const queue = tags.map<QueueAddJob>(item => ({
                    flush: {
                        tag: item.tag,
                        tenant,
                        locale: locale.code
                    }
                }));

                await context.pageBuilder.onPageBeforeFlush.publish({ tags, args: { queue } });
                await context.prerenderingServiceClient.queue.add(queue);
                await context.pageBuilder.onPageAfterFlush.publish({ tags, args: { queue } });
            }
        }
    });
});
