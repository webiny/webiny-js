import { HandlerPlugin, ProcessHookPlugin } from "./types";
import { DbQueueJob, DbRender, DbTagUrlLink } from "../../types";
import { HandlerResponse } from "@webiny/api-prerendering-service/types";
import defaults from "@webiny/api-prerendering-service/utils/defaults";
import getTagUrlLinkPKSK from "@webiny/api-prerendering-service/utils/getTagUrlLinkPKSK";
import debug from "debug";
import hash from "object-hash";
import chunk from "lodash/chunk";
import pluralize from "pluralize";

const log = debug("wby:api-prerendering-service:queue:process");

type Configuration = {
    handlers: {
        render: string;
        flush: string;
    };
};

export default (configuration: Configuration): HandlerPlugin => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        try {
            const handlerHookPlugins = context.plugins.byType<ProcessHookPlugin>(
                "ps-queue-process-hook"
            );

            for (let j = 0; j < handlerHookPlugins.length; j++) {
                const plugin = handlerHookPlugins[j];
                if (typeof plugin.beforeProcess === "function") {
                    await plugin.beforeProcess({
                        context
                    });
                }
            }

            for (let j = 0; j < handlerHookPlugins.length; j++) {
                const plugin = handlerHookPlugins[j];
                if (typeof plugin.afterProcess === "function") {
                    await plugin.afterProcess({
                        context
                    });
                }
            }

            log("Fetching all of the jobs added to the queue...");
            const [jobs] = await context.db.read<DbQueueJob>({
                ...defaults.db,
                query: {
                    PK: "PS#Q#JOB",
                    SK: { $gte: " " }
                }
            });

            log(`Fetched ${jobs.length} ${pluralize("job", jobs.length)}.`);

            if (jobs.length === 0) {
                log("No queue jobs to process. Exiting...");
                return { data: null, error: null };
            }

            log(`Deleting all jobs from the database so they don't get executed again...`);
            for (let i = 0; i < jobs.length; i++) {
                const { PK, SK } = jobs[i];
                await context.db.delete({
                    ...defaults.db,
                    query: {
                        PK,
                        SK
                    }
                });
            }

            log(`Deleted ${jobs.length} ${pluralize("job", jobs.length)} from the database.`);
            log("Eliminating duplicate jobs (no need to run the same job twice, right?).");

            const uniqueJobsObject = {};
            for (let i = 0; i < jobs.length; i++) {
                const job = jobs[i];
                // If job doesn't have args (which should not happen), just ignore the job.
                if (job.args) {
                    uniqueJobsObject[hash(job.args)] = job;
                }
            }

            // TODO: if we have a `render-all` job, then we can ignore all of the jobs basically (for DB namespace).

            const uniqueJobs = Object.values<DbQueueJob>(uniqueJobsObject);

            log(
                `Ended up with ${uniqueJobs.length} unique ${pluralize(
                    "job",
                    uniqueJobs.length
                )} that need to be processed.`
            );
            log(`Starting processing...Gathering a list of all URLs that need to be processed...`);

            const uniqueDbNamespaces: Record<string, any> = {};
            const uniqueJobsPerOperationPerDbNamespace: {
                flush: Record<string, any>;
                render: Record<string, any>;
            } = { flush: {}, render: {} };

            for (let i = 0; i < uniqueJobs.length; i++) {
                const uniqueJob = uniqueJobs[i];
                log("Processing unique job.", JSON.stringify(uniqueJob));

                // TODO: Ideally, we'd want to add support for processing `flush` jobs as well.
                const { render /*flush*/ } = args;

                if (render) {
                    const renderJobs = Array.isArray(render) ? render : [render];
                    for (let j = 0; j < renderJobs.length; j++) {
                        const renderJob = renderJobs[j];
                        const { tag, path, url, configuration } = renderJob;

                        const dbNamespace = configuration?.db?.namespace || "";
                        if (!uniqueDbNamespaces[dbNamespace]) {
                            uniqueDbNamespaces[dbNamespace] = uniqueDbNamespaces;
                        }

                        if (!uniqueJobsPerOperationPerDbNamespace.render[dbNamespace]) {
                            uniqueJobsPerOperationPerDbNamespace.render[dbNamespace] = {};
                        }

                        if (url) {
                            uniqueJobsPerOperationPerDbNamespace.render[dbNamespace][url] = {
                                url,
                                configuration
                            };
                        }

                        if (path) {
                            uniqueJobsPerOperationPerDbNamespace.render[dbNamespace][url] = {
                                path,
                                configuration
                            };
                        }

                        if (tag) {
                            // If we must render all pages with a specific tag, let's gather all URLs that contain it.
                            // TODO: improve - paginate instead of just naively executing read (all).
                            const [PK] = getTagUrlLinkPKSK({
                                tag,
                                dbNamespace
                            });

                            if (PK) {
                                // A) For tags like { key: "pb-page", value: "abc123" }, we need to use
                                // `$beginsWith: tag.value` for SK condition. SK is always in `TAG-VALUE#URL` format.
                                // B) For tags like { key: "pb-page" }, we don't care about tag value (value in SK
                                // column), so we don't send anything as the SK condition.
                                const SK = tag.value
                                    ? { $beginsWith: tag.value + "#" }
                                    : { $gte: " " };

                                // SK ready - let's execute the query.
                                const [tagUrlLinks] = await context.db.read<DbTagUrlLink>({
                                    ...defaults.db,
                                    query: { PK, SK }
                                });

                                // TODO: improve - call reads in batches, instead of 1-by-1.
                                // TODO: Or maybe store a copy of needed data in the link itself?
                                for (let k = 0; k < tagUrlLinks.length; k++) {
                                    const tagUrlLink = tagUrlLinks[k];
                                    const PK = [dbNamespace, "PS", "RENDER"]
                                        .filter(Boolean)
                                        .join("#");
                                    const url = tagUrlLink.url;

                                    const [[renderData]] = await context.db.read<DbRender>({
                                        ...defaults.db,
                                        query: {
                                            PK,
                                            SK: url
                                        }
                                    });

                                    if (renderData) {
                                        // We just need the `args` of the `renderData`.
                                        uniqueJobsPerOperationPerDbNamespace.render[dbNamespace][
                                            url
                                        ] = renderData.args;
                                    }
                                }
                            }
                        }
                    }
                }

                log("Processing unique job done, moving on to the next.");
            }

            let renderJobsCount = 0;
            for (const dbNamespace in uniqueJobsPerOperationPerDbNamespace.render) {
                renderJobsCount += Object.keys(
                    uniqueJobsPerOperationPerDbNamespace.render[dbNamespace]
                ).length;
            }

            log(
                `Done iterating over ${uniqueJobs.length} unique ${pluralize(
                    "job",
                    uniqueJobs.length
                )}. There is a total of ${renderJobsCount} render and 0 flush jobs to be processed, across ${
                    Object.keys(uniqueDbNamespaces).length
                } DB ${pluralize("namespace", Object.keys(uniqueDbNamespaces).length)}.`
            );

            log("Issuing render and flush jobs...");

            log("Started with render jobs...");
            if (Object.keys(uniqueJobsPerOperationPerDbNamespace.render).length === 0) {
                log("There are no render jobs to issue. Moving on...");
            } else {
                for (const dbNamespace in uniqueJobsPerOperationPerDbNamespace.render) {
                    const jobsForDbNamespace =
                        uniqueJobsPerOperationPerDbNamespace.render[dbNamespace];

                    const chunks = chunk(Object.values(jobsForDbNamespace), 10);

                    if (chunks.length === 0) {
                        log(
                            `There is nothing to issue for "${dbNamespace}" DB namespace. Continuing with the next one.`
                        );
                        continue;
                    }

                    log(
                        `Splat render jobs for "${dbNamespace}" DB namespace into ${
                            chunks.length
                        } ${pluralize(
                            "chunk",
                            chunks.length
                        )} (10 items per chunk). Issuing render jobs...`
                    );

                    for (let j = 0; j < chunks.length; j++) {
                        const current = chunks[j];

                        await context.handlerClient.invoke({
                            name: configuration.handlers.render,
                            await: false,
                            payload: current
                        });
                    }

                    log(
                        `Issued render jobs for "${dbNamespace}" DB namespace. Render handler was invoked ${
                            chunks.length
                        } ${pluralize("time", chunks.length)}.`
                    );
                }

                log("All render jobs issued. Moving on with issuing flush jobs.");
            }

            log("Started with flush jobs...");
            if (Object.keys(uniqueJobsPerOperationPerDbNamespace.flush).length === 0) {
                log("There are no flush jobs to issue. Moving on...");
            } else {
                // TODO: probably a good amount of code can be copied from above render processing.
            }

            log("All queue jobs processed, exiting...");
            return { data: null, error: null };
        } catch (e) {
            log("An error occurred while trying to add to prerendering queue...", e);
            return { data: null, error: e };
        }
    }
});
