import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Button, Loader, Text } from "@webiny/admin-ui";
import type { RunViewPresenter } from "../../abstractions.js";
import type { SiteBuildStep } from "~/shared/types.js";
import { websiteUrl } from "../composed/websiteUrl.js";

/**
 * The job's site in a tenant of its own (compose-tenant-promotion-design.md): the tenant, its last
 * build step by step, and the actions to build it again and open it.
 *
 * Shown on the Promote gate once Promote has run, because a build copies what Promote chose. Promote
 * into this tenant stays beside it until after the demo.
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
    const home = websiteUrl(vm.websiteDomain, "/");
    const openUrl = site && home ? `${home}?wb.tenant=${encodeURIComponent(site.tenantId)}` : null;

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
                            : "Builds this site in a new tenant named after the job: its theme, the promoted components, its images and its pages."}
                    </Text>
                </div>
                <div className="flex flex-shrink-0 items-center gap-sm">
                    {site && build?.status === "done" && openUrl ? (
                        <a
                            href={openUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="cursor-pointer text-sm text-primary-default underline"
                        >
                            Open site
                        </a>
                    ) : null}
                    <Button
                        variant={site ? "secondary" : "primary"}
                        size="sm"
                        text={building ? "Building…" : site ? "Rebuild site" : "Build site"}
                        disabled={building}
                        onClick={() => void presenter.buildSite()}
                    />
                </div>
            </div>

            {build ? (
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
                    The build stopped: {build.error ?? "no reason recorded"}. Rebuilding starts
                    again; the steps that finished are quick the second time.
                </Alert>
            ) : null}
            {site && build?.status === "done" && !openUrl ? (
                <Text size="sm" className="text-neutral-strong">
                    The website domain is not set, so the site cannot be opened from here.
                </Text>
            ) : null}
        </div>
    );
});
