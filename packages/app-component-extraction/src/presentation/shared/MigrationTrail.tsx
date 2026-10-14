import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/** The label the admin's menu gives this app, so the trail starts where the menu does. */
export const APP_LABEL = "Website Migration";

interface Props {
    /** The job, once known; its crumb opens the job. */
    job?: { id: string; name: string } | null;
    /** The run, once known; its crumb opens the run. */
    run?: { id: string; label: string } | null;
    /** Where in the run, or on the page, the person is: the trail's last item, not a link. */
    current?: string | null;
}

/**
 * The admin top bar's trail for this app: Website Migration, the job, the run, and where in it.
 *
 * Each crumb is a link except the last, which the header marks as the current page. The header
 * orders crumbs by when they mount, so a view renders this once its job and run are known: a crumb
 * that mounted later would land after the ones already there. Until then the header keeps the
 * previous trail on screen.
 */
export const MigrationTrail = ({ job, run, current }: Props) => (
    <>
        <AdminConfig.Breadcrumb
            name="website-migration"
            label={APP_LABEL}
            to={{ route: Routes.List }}
        />
        {job ? (
            <AdminConfig.Breadcrumb
                name="website-migration-job"
                label={job.name}
                to={{ route: Routes.Job, params: { jobId: job.id } }}
            />
        ) : null}
        {run ? (
            <AdminConfig.Breadcrumb
                name="website-migration-run"
                label={run.label}
                to={{ route: Routes.Run, params: { runId: run.id } }}
            />
        ) : null}
        {current ? (
            <AdminConfig.Breadcrumb name="website-migration-current" label={current} />
        ) : null}
    </>
);
