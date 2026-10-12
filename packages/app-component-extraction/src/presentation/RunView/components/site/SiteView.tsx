import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Button, Scrollbar, Tag, Text } from "@webiny/admin-ui";
import { stageEntry } from "~/shared/ledger.js";
import { StatusDot } from "~/presentation/shared/StatusIndicator.js";
import type { ComposedPageDto } from "~/shared/types.js";
import type { RunViewPresenter } from "../../abstractions.js";
import { composedStatus, STATUS_TAG } from "../composed/pageStatus.js";
import { siteUrl } from "./siteUrl.js";
import { SiteCard } from "./SiteCard.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

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
    const builtFromOtherRun = !!build && !!run && build.runId !== run.id;

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
                    The migrated pages, published into a tenant of their own with the site&apos;s theme,
                    the approved components and the images.
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
                            site&apos;s tenant and copies the theme, the approved components, the images
                            and all of these pages into it.
                        </Text>
                    ) : null}

                    {approved || site ? <SiteCard presenter={presenter} /> : null}

                    {builtFromOtherRun ? (
                        <Text size="sm" className="text-neutral-strong">
                            The site was last published from another run of this job. Its pages are
                            below; publishing from this run replaces them.
                        </Text>
                    ) : null}

                    {build?.status === "done" ? (
                        vm.sitePageMapLoading && !map ? (
                            <Text size="sm" className="text-neutral-strong">
                                Loading the site&apos;s pages…
                            </Text>
                        ) : map ? (
                            <SitePages presenter={presenter} />
                        ) : (
                            <Text size="sm" className="text-neutral-strong">
                                The site&apos;s page list could not be read.
                            </Text>
                        )
                    ) : null}
                </div>
            </Scrollbar>
        </div>
    );
});

const SitePages = createReactiveComponent(function SitePages({ presenter }: Props) {
    const { vm } = presenter;
    const map = vm.sitePageMap!;
    const tenantId = vm.site!.tenantId;
    const view = (page: ComposedPageDto) => siteUrl(vm.websiteDomain, page.path, tenantId);

    return (
        <div className="flex flex-col gap-xs">
            <Text size="sm" className="font-medium">
                {map.pages.length} page{map.pages.length === 1 ? "" : "s"} on the site
            </Text>

            {map.pages.map(page => {
                const tag = STATUS_TAG[composedStatus(page)];
                const url = view(page);
                const live = vm.siteLivePageByPath[page.path];
                // Undefined: not answered yet. Null or another id: a visitor reaches a different page.
                const notLive = live !== undefined && live !== page.pageId;
                return (
                    <div
                        key={page.path}
                        className="flex items-center gap-md rounded-sm border border-neutral-dimmed px-sm py-xs"
                    >
                        <div className="flex min-w-0 flex-1 flex-col gap-xxs">
                            <Text className="truncate font-medium" title={page.title}>
                                {page.title || page.path}
                            </Text>
                            <Text
                                size="sm"
                                className="truncate font-mono text-neutral-strong"
                                title={`${page.sourceUrl} → ${page.path}`}
                            >
                                {pathOf(page.sourceUrl)} → {page.path}
                            </Text>
                        </div>
                        <div className="w-[12rem] flex-shrink-0">
                            <Tag variant={tag.variant as never} content={tag.content} />
                        </div>
                        <div className="w-[9rem] flex-shrink-0">
                            {notLive ? (
                                <Tag variant={"warning" as never} content="not the live page" />
                            ) : null}
                        </div>
                        <Button
                            variant="tertiary"
                            size="sm"
                            text="View page"
                            disabled={!url}
                            title={
                                url ??
                                "Website Builder has no preview domain set, so there is no address to open this page at."
                            }
                            onClick={() => url && window.open(url, "_blank", "noopener")}
                        />
                    </div>
                );
            })}

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
