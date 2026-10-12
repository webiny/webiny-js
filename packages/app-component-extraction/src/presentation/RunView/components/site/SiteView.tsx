import React from "react";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import { Alert, Button, Scrollbar, Text } from "@webiny/admin-ui";
import { stageEntry } from "~/shared/ledger.js";
import { StatusDot } from "~/presentation/shared/StatusIndicator.js";
import { Routes } from "~/routes.js";
import type { RunViewPresenter } from "../../abstractions.js";
import { BuildSteps, SiteCard } from "./SiteCard.js";
import { SiteOverview, SitePagesTable, SiteQualities } from "./SiteResult.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const runLabel = (runNumber: number | null): string =>
    runNumber === null ? "another run" : `run-${String(runNumber).padStart(4, "0")}`;

const pathOf = (url: string): string => {
    try {
        return new URL(url).pathname || "/";
    } catch {
        return url;
    }
};

/**
 * Where the migrated pages are: the job's site, built into a tenant of its own.
 *
 * Everything on it is read in the SITE'S tenant: the page map of its last build and which page each
 * path serves there. The composed pages panel in the developer row shows the extraction tenant's
 * composition, a different set of pages at the same paths, and its links open the admin's own
 * tenant. A newcomer opening that would be looking at the wrong site.
 */
export const SiteView = createReactiveComponent(function SiteView({ presenter }: Props) {
    const { vm } = presenter;
    const run = vm.run;
    const site = vm.site;
    const build = site?.lastBuild;
    const approved = run ? stageEntry(run, "promote")?.status === "done" : false;
    const map = vm.sitePageMap;
    // How it was built: folded away once published, on request.
    const [stepsOpen, setStepsOpen] = React.useState(false);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-col gap-xxs border-b border-neutral-dimmed px-md py-sm">
                <div className="flex items-center gap-sm">
                    <StatusDot
                        status={build?.status === "done" ? "complete" : "not-started"}
                        stageNumber={10}
                    />
                    <Text className="font-medium">10 · Site</Text>
                </div>
                <Text size="sm" className="text-neutral-strong">
                    The migrated pages, published into a tenant of their own with the site&apos;s
                    theme, the approved components and the images.
                </Text>
            </div>

            <Scrollbar>
                <div className="flex flex-col gap-sm p-md">
                    {!approved && !site ? (
                        <Alert type="info" variant="subtle">
                            <div className="flex flex-wrap items-center justify-between gap-sm">
                                <span>
                                    Approve components first: a site is built from the approved
                                    components.
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    text="Go to 9 · Approve components"
                                    onClick={() => presenter.selectStage("promote")}
                                />
                            </div>
                        </Alert>
                    ) : null}

                    {approved && !build && vm.siteAssembledCount !== null ? (
                        <Text size="sm" className="text-neutral-strong">
                            This run assembled {vm.siteAssembledCount} page
                            {vm.siteAssembledCount === 1 ? "" : "s"}. Publishing creates the
                            site&apos;s tenant and copies the theme, the approved components, the
                            images and all of these pages into it.
                        </Text>
                    ) : null}

                    {/* Before the first publish, while one runs, or after one failed, the action is the point. */}
                    {(approved || site) && build?.status !== "done" ? (
                        <SiteCard presenter={presenter} />
                    ) : null}

                    {/* Published: the site at a glance, what it produced, then its pages. */}
                    {build?.status === "done" ? (
                        <>
                            <SiteOverview
                                presenter={presenter}
                                stepsOpen={stepsOpen}
                                onToggleSteps={() => setStepsOpen(!stepsOpen)}
                            />
                            {stepsOpen ? (
                                <div className="rounded-md border border-neutral-dimmed px-md py-sm">
                                    <BuildSteps build={build} building={false} />
                                </div>
                            ) : null}
                            <SiteQualities presenter={presenter} />
                            {vm.sitePageMapLoading && !map ? (
                                <Text size="sm" className="text-neutral-strong">
                                    Loading the site&apos;s pages…
                                </Text>
                            ) : map ? (
                                <SitePages presenter={presenter} />
                            ) : (
                                <Text size="sm" className="text-neutral-strong">
                                    The site&apos;s page list could not be read.
                                </Text>
                            )}
                        </>
                    ) : null}

                    {/* The overview names the run; this says what it means when it is not the run on screen. */}
                    {build?.status === "done" &&
                    vm.siteBuiltFrom &&
                    vm.siteBuiltFrom.runId !== vm.run?.id ? (
                        <BuiltFrom presenter={presenter} />
                    ) : null}

                    {build?.status === "done" && vm.siteInventory ? (
                        <TenantInventory presenter={presenter} />
                    ) : null}
                </div>
            </Scrollbar>
        </div>
    );
});

/**
 * Which run the site's pages come from, always, and what that means when it is not the run on screen.
 */
const BuiltFrom = createReactiveComponent(function BuiltFrom({ presenter }: Props) {
    const { vm } = presenter;
    const { goToRoute } = useRouter();
    const builtFrom = vm.siteBuiltFrom!;
    const finished = vm.site?.lastBuild?.finishedOn;
    const other = builtFrom.runId !== vm.run?.id;
    return (
        <div className="flex flex-wrap items-center gap-sm">
            <Text size="sm" className={other ? "font-medium" : "text-neutral-strong"}>
                Built from {runLabel(builtFrom.runNumber)}
                {finished ? `, published ${new Date(finished).toLocaleString()}` : ""}.
                {other && vm.run
                    ? ` You are looking at ${runLabel(vm.run.runNumber)}: the pages below are ${runLabel(builtFrom.runNumber)}'s, and publishing from this run replaces them.`
                    : ""}
            </Text>
            {other ? (
                <Button
                    variant="tertiary"
                    size="sm"
                    text={`Open ${runLabel(builtFrom.runNumber)}`}
                    onClick={() => goToRoute(Routes.Run, { runId: builtFrom.runId })}
                />
            ) : null}
        </div>
    );
});

/**
 * What the site's tenant holds beyond its live pages.
 *
 * Builds never delete, and stage 9 keeps both when a name is taken, so every regenerate, re-approve
 * and publish leaves a component no page uses, and every build leaves the previous pages unpublished.
 * Each leftover component still ships with every page and sits in the editor's palette. Said here so
 * it is seen, not found.
 */
const TenantInventory = createReactiveComponent(function TenantInventory({ presenter }: Props) {
    const inventory = presenter.vm.siteInventory!;
    const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
    // Unpublished pages are earlier builds' copies; drafts are a preview's or someone's work in progress.
    const others = [
        inventory.unpublishedPages > 0
            ? `${plural(inventory.unpublishedPages, "unpublished page")} from earlier builds`
            : null,
        (inventory.draftPages ?? 0) > 0 ? plural(inventory.draftPages ?? 0, "draft") : null
    ].filter(Boolean);
    const alsoHolds = others.length > 0 ? others.join(" and ") : null;
    const pending = inventory.pending ?? [];
    const waiting =
        pending.length > 0
            ? ` ${plural(pending.length, "newly approved component")} ${pending.length === 1 ? "goes" : "go"} live at the next publish.`
            : "";
    if (inventory.unused.length === 0) {
        // The overview already says how many components the pages use; only what it does not say.
        if (!alsoHolds && !waiting) {
            return null;
        }
        return (
            <Text size="sm" className="text-neutral-strong">
                The site&apos;s tenant holds {plural(inventory.components, "component")}
                {pending.length > 0
                    ? `: ${plural(inventory.components - pending.length, "component")} used by its ${plural(inventory.publishedPages, "live page")}`
                    : `, all used by its ${plural(inventory.publishedPages, "live page")}`}
                {alsoHolds ? `, and ${alsoHolds}` : ""}.{waiting}
            </Text>
        );
    }
    // A site that approves into its tenant removes leftovers when it publishes, unless a page still
    // names them; an older site never removes them.
    const removesAtPublish = Boolean(presenter.vm.job?.siteTenantFromStart);
    return (
        <Alert type="warning" variant="subtle">
            The site&apos;s tenant holds {plural(inventory.unused.length, "component")} that no live
            page uses and the current approval does not hold: {inventory.unused.join(", ")}.{" "}
            {removesAtPublish
                ? inventory.unused.length === 1
                    ? "Publishing keeps it while a draft or an unpublished page still names it, and it ships with every page of the site."
                    : "Publishing keeps them while a draft or an unpublished page still names them, and each ships with every page of the site."
                : inventory.unused.length === 1
                  ? "Publishing does not remove it, and it still ships with every page of the site."
                  : "Publishing does not remove them, and each still ships with every page of the site."}
            {alsoHolds ? ` It also holds ${alsoHolds}.` : ""}
            {waiting}
        </Alert>
    );
});

const SitePages = createReactiveComponent(function SitePages({ presenter }: Props) {
    const { vm } = presenter;
    const map = vm.sitePageMap!;

    return (
        <div className="flex flex-col gap-xs">
            <SitePagesTable presenter={presenter} />

            {(map.kept ?? []).length > 0 ? (
                <Alert type="warning" variant="subtle">
                    Could not be published again, so the earlier version stays live:{" "}
                    {(map.kept ?? []).map(page => page.path).join(", ")}.
                </Alert>
            ) : null}
            {(map.dropped ?? []).length > 0 ? (
                <Alert type="info" variant="subtle">
                    Taken off the site because this run no longer has them:{" "}
                    {(map.dropped ?? []).map(page => page.path).join(", ")}.
                </Alert>
            ) : null}

            {map.failed.map(failure => (
                <div
                    key={failure.sourceUrl}
                    className="flex flex-col gap-xxs rounded-sm border border-destructive-default px-sm py-xs"
                >
                    <Text className="truncate font-mono" title={failure.sourceUrl}>
                        {pathOf(failure.sourceUrl)}
                    </Text>
                    <Text size="sm" className="text-destructive-default">
                        {failure.reason}
                    </Text>
                </div>
            ))}
        </div>
    );
});
