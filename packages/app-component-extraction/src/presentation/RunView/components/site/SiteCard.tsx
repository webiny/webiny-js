import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Button, Loader, Text } from "@webiny/admin-ui";
import type { RunViewPresenter } from "../../abstractions.js";
import type { SiteBuildStep } from "~/shared/types.js";
import { siteUrl } from "./siteUrl.js";

/**
 * The job's site in a tenant of its own (compose-tenant-promotion-design.md): the tenant, its last
 * build step by step, and the actions to publish it again and view it.
 *
 * Shown in the Site view, the rail entry after the stages. It sat on the Promote gate until site
 * stage MS1, where a newcomer could not find it.
 */
const STEPS: Array<{ step: SiteBuildStep; label: string }> = [
    { step: "tenant", label: "Tenant" },
    { step: "theme", label: "Theme" },
    { step: "components", label: "Components" },
    { step: "images", label: "Images" },
    { step: "pages", label: "Pages" }
];

interface Props {
    presenter: RunViewPresenter.Interface;
}

export const SiteCard = createReactiveComponent(function SiteCard({ presenter }: Props) {
    const { vm } = presenter;
    const site = vm.site;
    const build = site?.lastBuild;
    const building = vm.buildingSite || build?.status === "running";
    // A site record exists from the first approval for a job that approves into its site tenant, so the
    // record alone does not mean the site was ever published.
    const published = Boolean(build);
    const openUrl = site ? siteUrl(vm.websiteDomain, "/", site.tenantId) : null;
    // The steps are how it was built, not the result: folded away once a build is done, open while
    // one runs or after one failed, where they are what someone needs to read.
    const [stepsOpen, setStepsOpen] = React.useState(false);
    const showSteps = Boolean(build) && (build?.status !== "done" || stepsOpen);

    return (
        <div className="flex flex-col gap-sm rounded-md border border-neutral-dimmed px-md py-sm">
            <div className="flex flex-wrap items-start justify-between gap-sm">
                <div className="flex min-w-0 flex-col gap-xxs">
                    <Text size="sm" className="font-medium">
                        Site in its own tenant
                    </Text>
                    <Text size="sm" className="text-neutral-strong">
                        {site
                            ? `Tenant "${site.tenantName}" (${site.tenantId}).`
                            : "Publishes this site into a new tenant named after the job: its theme, the approved components, its images and its pages."}
                    </Text>
                </div>
                <div className="flex flex-shrink-0 items-center gap-sm">
                    {build?.status === "done" ? (
                        <Button
                            variant="tertiary"
                            size="sm"
                            text={stepsOpen ? "Hide how it was built" : "How it was built"}
                            onClick={() => setStepsOpen(!stepsOpen)}
                        />
                    ) : null}
                    <Button
                        variant={published ? "secondary" : "primary"}
                        size="sm"
                        text={
                            building ? "Publishing…" : published ? "Publish again" : "Publish site"
                        }
                        disabled={building}
                        onClick={() => void presenter.buildSite()}
                    />
                </div>
            </div>

            {showSteps && build ? (
                <div className="flex flex-col gap-xxs">
                    {STEPS.map(({ step, label }) => {
                        const record = build.steps.find(item => item.step === step);
                        return (
                            <div key={step} className="flex items-center gap-sm">
                                <span className="inline-flex w-[16px] justify-center">
                                    {record?.status === "running" ? (
                                        <Loader size="xs" />
                                    ) : record?.status === "done" ? (
                                        <Text size="sm" className="text-success-strong">
                                            ✓
                                        </Text>
                                    ) : record?.status === "failed" ? (
                                        <Text size="sm" className="text-destructive-default">
                                            ✕
                                        </Text>
                                    ) : (
                                        <Text size="sm" className="text-neutral-muted">
                                            ·
                                        </Text>
                                    )}
                                </span>
                                <Text size="sm" className="w-[96px] font-medium">
                                    {label}
                                </Text>
                                <Text
                                    size="sm"
                                    className={
                                        record ? "text-neutral-strong" : "text-neutral-muted"
                                    }
                                >
                                    {record?.detail ?? (building ? "Waiting." : "")}
                                </Text>
                            </div>
                        );
                    })}
                </div>
            ) : null}

            {build?.status === "failed" ? (
                <Alert type="danger">
                    Publishing stopped: {build.error ?? "no reason recorded"}. Publishing again
                    starts over; the steps that finished are quick the second time.
                </Alert>
            ) : null}
            {site && build?.status === "done" && !openUrl ? (
                <Text size="sm" className="text-neutral-strong">
                    The website domain is not set, so the site cannot be viewed from here.
                </Text>
            ) : null}
        </div>
    );
});
