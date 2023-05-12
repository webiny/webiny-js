import hash from "object-hash";
import chunk from "lodash/chunk";
import pluralize from "pluralize";
import { FlushJob, RenderJob, QueueJob, PrerenderingServiceStorageOperations } from "~/types";
import { EventPlugin } from "@webiny/handler";

const IS_TEST = process.env.NODE_ENV === "test";
const log = (...args: string[]) => {
    if (IS_TEST) {
        return;
    }

    return console.log(...args);
};

export interface Configuration {
    handlers: {
        render: string;
        flush: string;
    };
    storageOperations: PrerenderingServiceStorageOperations;
}

export interface Stats {
    jobs: {
        unique: number;
        retrieved: number;
        renderAll: number;
    };
}

export default (params: Configuration) => {
    const { storageOperations } = params;

    return new EventPlugin(async ({ context }) => {
        const stats: Stats = {
            jobs: {
                unique: 0,
                retrieved: 0,
                renderAll: 0
            }
        };

        try {
            log("Fetching all of the jobs added to the queue...");

            const jobs = await storageOperations.listQueueJobs();

            stats.jobs.retrieved = jobs.length;
            log(`Fetched ${jobs.length} ${pluralize("job", jobs.length)}.`);

            if (jobs.length === 0) {
                log("No queue jobs to process. Exiting...");
                return {
                    data: {
                        stats
                    },
                    error: null
                };
            }

            log(`Deleting all jobs from the database so they don't get executed again...`);

            await storageOperations.deleteQueueJobs({
                queueJobs: jobs
            });

            log(`Deleted ${jobs.length} ${pluralize("job", jobs.length)} from the database.`);
            log("Eliminating duplicate jobs (no need to run the same job twice, right?).");

            /**
             * Let's also note all render-all-pages jobs (path: "*").
             */
            const renderAllJobs: Record<string, QueueJob> = {};

            const uniqueJobsObject: Record<string, QueueJob> = {};
            for (const job of jobs) {
                /**
                 * If job doesn't have args (which should not happen), just ignore the job.
                 */
                if (!job.args) {
                    continue;
                }

                uniqueJobsObject[hash(job.args)] = job;
                if (job.args.render) {
                    const { path, tenant = "root" } = job.args.render;
                    if (path === "*") {
                        renderAllJobs[tenant] = job;
                    }
                }

                /**
                 * TODO: Ideally, we'd want to add support for processing `flush` jobs as well.
                 */
            }

            log(
                `Detected ${
                    Object.values(renderAllJobs).length
                } render-all-pages (path: *) ${pluralize(
                    "job",
                    Object.values(renderAllJobs).length
                )}.`
            );

            stats.jobs.renderAll = Object.values(renderAllJobs).length;

            let uniqueJobs = Object.values<QueueJob>(uniqueJobsObject);

            /**
             * Now, if we have something in the "renderAllJobs" array, let's remove all
             * jobs for every tenant that is listed in it.
             */
            if (Object.values(renderAllJobs).length > 0) {
                uniqueJobs = uniqueJobs.filter(job => {
                    const render = job.args?.render;
                    if (!render) {
                        return true;
                    }

                    return !renderAllJobs[render.tenant];
                });

                /**
                 * TODO: Ideally, we'd want to add support for processing `flush` jobs as well.
                 */
            }

            /**
             * Once we've removed all jobs for dbNamespaces that have the render-all-pages job,
             * let's add these jobs back so they actually get performed below.
             */

            uniqueJobs.push(...Object.values(renderAllJobs));

            stats.jobs.unique = uniqueJobs.length;

            log(
                `Ended up with ${uniqueJobs.length} unique ${pluralize(
                    "job",
                    uniqueJobs.length
                )} that need to be processed.`
            );
            log(`Starting processing...Gathering a list of all URLs that need to be processed...`);

            const uniqueTenants: string[] = [];
            const uniqueJobsPerOperationPerTenant: {
                flush: Record<string, Record<string, FlushJob>>;
                render: Record<string, Record<string, RenderJob>>;
            } = { flush: {}, render: {} };

            for (const uniqueJob of uniqueJobs) {
                log("Processing unique job.", JSON.stringify(uniqueJob));
                const { args } = uniqueJob;

                /**
                 * TODO: Ideally, we'd want to add support for processing `flush` jobs as well.
                 */
                const { render /*flush*/ } = args;

                if (render) {
                    const { tag, path, tenant } = render;

                    if (!uniqueTenants.includes(tenant)) {
                        uniqueTenants.push(tenant);
                    }

                    if (!uniqueJobsPerOperationPerTenant.render[tenant]) {
                        uniqueJobsPerOperationPerTenant.render[tenant] = {};
                    }

                    if (path) {
                        if (path === "*") {
                            const renders = await storageOperations.listRenders({
                                where: { tenant }
                            });

                            for (const render of renders) {
                                const { tenant, path } = render;
                                /**
                                 * We just need the `args` of the `renderData`.
                                 */
                                uniqueJobsPerOperationPerTenant.render[tenant][path] = render;
                            }
                        } else if (path.endsWith("*")) {
                            /**
                             * Future feature - ability to search by prefix, e.g. "/en/*" or "/categories/books/*".
                             */
                        } else {
                            uniqueJobsPerOperationPerTenant.render[tenant][path] = render;
                        }
                    }

                    if (tag) {
                        const renders = await storageOperations.listRenders({
                            where: { tenant, tag }
                        });

                        /**
                         * If we must render all pages with a specific tag, let's gather all paths that contain it.
                         * A) For tags like { key: "pb-page", value: "abc123" }, we need to use
                         * `$beginsWith: tag.value` for SK condition. SK is always in `TAG-VALUE#PATH` format.
                         * B) For tags like { key: "pb-page" }, we don't care about tag value (value in SK
                         * column), so we don't send anything as the SK condition.
                         */
                        for (const render of renders) {
                            uniqueJobsPerOperationPerTenant.render[tenant][render.path] = render;
                        }
                    }
                }

                log("Processing unique job done, moving on to the next.");
            }

            let renderJobsCount = 0;
            for (const tenant in uniqueJobsPerOperationPerTenant.render) {
                renderJobsCount += Object.keys(
                    uniqueJobsPerOperationPerTenant.render[tenant]
                ).length;
            }

            log(
                `Done iterating over ${uniqueJobs.length} unique ${pluralize(
                    "job",
                    uniqueJobs.length
                )}. There is a total of ${renderJobsCount} render and 0 flush jobs to be processed, across ${
                    uniqueTenants.length
                } tenant(s).`
            );

            log("Issuing render and flush jobs...");

            log("Started with render jobs...");
            if (Object.keys(uniqueJobsPerOperationPerTenant.render).length === 0) {
                log("There are no render jobs to issue. Moving on...");
            } else {
                for (const tenant in uniqueJobsPerOperationPerTenant.render) {
                    const jobsForDbNamespace = uniqueJobsPerOperationPerTenant.render[tenant];

                    const chunks = chunk(Object.values(jobsForDbNamespace), 10);

                    if (chunks.length === 0) {
                        log(
                            `There is nothing to issue for "${tenant}" tenant. Continuing with the next one.`
                        );
                        continue;
                    }

                    log(
                        `Split render jobs for "${tenant}" tenant into ${chunks.length} ${pluralize(
                            "chunk",
                            chunks.length
                        )} (10 items per chunk). Issuing render jobs...`
                    );

                    for (let j = 0; j < chunks.length; j++) {
                        const current = chunks[j];

                        await context.handlerClient.invoke({
                            name: params.handlers.render,
                            await: false,
                            payload: current
                        });
                    }

                    log(
                        `Issued render jobs for "${tenant}" tenant. Render handler was invoked ${
                            chunks.length
                        } ${pluralize("time", chunks.length)}.`
                    );
                }

                log("All render jobs issued. Moving on with issuing flush jobs.");
            }

            log("Started with flush jobs...");
            if (Object.keys(uniqueJobsPerOperationPerTenant.flush).length === 0) {
                log("There are no flush jobs to issue. Moving on...");
            } else {
                /**
                 * TODO: probably a good amount of code can be copied from above render processing.
                 */
            }

            log(`All queue jobs processed, triggering "afterProcess" hook...`);

            return {
                data: {
                    stats
                },
                error: null
            };
        } catch (ex) {
            console.error("An error occurred while trying to add to prerendering queue...", ex);
            return {
                data: {
                    stats
                },
                error: ex
            };
        }
    });
};
