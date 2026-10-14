import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { BetaBadge, Button, cn, Heading, Icon, Table, Tag, Text, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as UpdateIcon } from "@webiny/icons/update.svg";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as PublishIcon } from "@webiny/icons/publish.svg";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as ExpandLessIcon } from "@webiny/icons/expand_less.svg";
import type { ComposedPageDto } from "~/shared/types.js";
import { StatusDot } from "~/presentation/shared/StatusIndicator.js";
import type { RunViewPresenter } from "../../abstractions.js";
import { caveatReasons, composedStatus, STATUS_TAG } from "../composed/pageStatus.js";
import { siteUrl } from "./siteUrl.js";
import { ComparePageView } from "./ComparePageView.js";
import {
    type Cell,
    formats,
    pageCells,
    PASS_LABEL,
    PASSES,
    PASSES_ACTION,
    PASSES_NOT_YET,
    plural,
    type QualityItem,
    qualityGroups,
    qualitySummary,
    RESPONSIVENESS_NOTE,
    size,
    siteWideNotYet
} from "./siteResultLines.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const PREVIEW_NOTE =
    "The preview address: the demo website with this site's tenant. The site's own domain is the source site's, once it points here.";

const runLabel = (runNumber: number | null): string =>
    runNumber === null ? "another run" : `run-${String(runNumber).padStart(4, "0")}`;

const Why = ({ note }: { note: string }) => (
    <Tooltip
        content={note}
        trigger={
            <span className="cursor-default text-sm text-neutral-muted underline decoration-dotted">
                why
            </span>
        }
    />
);

/**
 * A card with the design's own padding. The design system's Card pads its body to 32px and always
 * renders a footer, so a card whose header and rows set their own spacing cannot use it; this keeps
 * its surface (radius, border, shadow) from the same tokens.
 */
const Panel = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div
        className={cn(
            "overflow-hidden rounded-lg border border-neutral-dimmed bg-neutral-base shadow-sm",
            className
        )}
    >
        {children}
    </div>
);

/** A panel's title row: the design's 14px by 16px, a title and what sits beside it. */
const PanelHeader = ({ children, bordered }: { children: React.ReactNode; bordered?: boolean }) => (
    <div
        className={cn(
            "flex flex-wrap items-center justify-between gap-sm px-md py-sm-extra",
            bordered && "border-b border-neutral-dimmed"
        )}
    >
        {children}
    </div>
);

/** The not-yet state wherever it is shown: the same icon and words as on the quality cards. */
const NotYetTag = ({ full }: { full: string }) => (
    <Tooltip
        content={full}
        trigger={
            <span className="cursor-default">
                <Tag variant="neutral-light" icon={<UpdateIcon />} content="Not yet" />
            </span>
        }
    />
);

const CellValue = ({ cell }: { cell: Cell }) =>
    cell.notYet ? (
        <NotYetTag full={cell.full} />
    ) : (
        <Tooltip
            content={cell.full}
            trigger={
                <span className="cursor-default text-sm text-neutral-primary">{cell.label}</span>
            }
        />
    );

/**
 * The site at a glance: published, how many pages, and the four facts a newcomer asks first. The
 * actions sit here: how it was built and the preview. Publishing again sits beside the qualities,
 * next to the sentence saying what it brings.
 */
export const SiteOverview = createReactiveComponent(function SiteOverview({
    presenter,
    stepsOpen,
    onToggleSteps
}: Props & { stepsOpen: boolean; onToggleSteps: () => void }) {
    const { vm } = presenter;
    const site = vm.site!;
    const build = site.lastBuild!;
    const result = vm.siteResult;
    const inventory = vm.siteInventory;
    const pages = result?.pages.length ?? vm.sitePageMap?.pages.length ?? 0;
    const viewUrl = siteUrl(vm.websiteDomain, "/", site.tenantId);
    const finished = build.finishedOn ? new Date(build.finishedOn) : null;

    // "All used" only when nothing is left over and nothing waits for the next publish.
    const placed = inventory
        ? inventory.components - inventory.unused.length - (inventory.pending ?? []).length
        : null;
    const allUsed = inventory !== null && placed === inventory.components;
    const subline = !inventory
        ? "With the site's own theme."
        : allUsed
          ? `With the site's own theme and ${plural(inventory.components, "component")}, all used by its ${plural(pages, "live page")}.`
          : `With the site's own theme and ${plural(inventory.components, "component")}: ${placed} used by its ${plural(pages, "live page")}, ${inventory.components - (placed ?? 0)} not.`;

    const stats: Array<{ label: string; value: string; sub: string; title?: string }> = [
        {
            label: "Components",
            value: inventory ? String(inventory.components) : "–",
            sub: !inventory
                ? "Not read"
                : allUsed
                  ? "All used by the live pages"
                  : `${placed} used by the live pages`
        },
        {
            label: "Images",
            value: result ? plural(result.images.files, "file") : "–",
            sub: result
                ? result.images.files === 0
                    ? "None in this site"
                    : `${size(result.images.bytes)} · ${formats(result.images)}`
                : "Not read"
        },
        { label: "Tenant", value: "Own tenant", sub: site.tenantId, title: site.tenantName },
        {
            label: "Published",
            value: finished ? finished.toLocaleDateString() : "–",
            sub: [
                finished
                    ? finished.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : null,
                vm.siteBuiltFrom ? `built from ${runLabel(vm.siteBuiltFrom.runNumber)}` : null
            ]
                .filter(Boolean)
                .join(" · ")
        }
    ];

    return (
        <Panel className="px-lg pb-md-plus pt-lg">
            <div className="flex flex-col gap-md-plus">
                <div className="flex flex-wrap items-start justify-between gap-lg">
                    <div className="flex min-w-0 flex-col">
                        <span>
                            <Tag variant="success-light" content="Published" />
                        </span>
                        <Heading level={3} className="mb-xs mt-sm-plus">
                            {plural(pages, "page")}, live in their own tenant
                        </Heading>
                        <Text size="md" className="text-neutral-strong">
                            {subline}
                        </Text>
                    </div>
                    <div className="flex flex-shrink-0 flex-wrap items-center gap-sm">
                        <Button
                            variant="tertiary"
                            text={stepsOpen ? "Hide how it was built" : "How it was built"}
                            onClick={onToggleSteps}
                        />
                        <Tooltip
                            content={
                                viewUrl
                                    ? PREVIEW_NOTE
                                    : "The website domain is not set, so the site cannot be viewed from here."
                            }
                            trigger={
                                <Button
                                    variant="primary"
                                    text="View site"
                                    icon={<OpenInNewIcon />}
                                    disabled={!viewUrl}
                                    onClick={() =>
                                        viewUrl && window.open(viewUrl, "_blank", "noopener")
                                    }
                                />
                            }
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 rounded-lg border border-neutral-dimmed lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className={cn(
                                "flex min-w-0 flex-col px-md py-sm-extra",
                                index < stats.length - 1 && "lg:border-r lg:border-neutral-dimmed"
                            )}
                            title={stat.title}
                        >
                            <Text
                                size="sm"
                                className="font-semibold uppercase tracking-wide text-neutral-muted"
                            >
                                {stat.label}
                            </Text>
                            <Heading level={4} className="mt-xxs">
                                {stat.value}
                            </Heading>
                            <Text size="sm" className="truncate text-neutral-strong">
                                {stat.sub}
                            </Text>
                        </div>
                    ))}
                </div>
            </div>
        </Panel>
    );
});

const QualityCard = ({ item }: { item: QualityItem }) => (
    <div
        className={cn(
            "flex min-w-0 flex-col gap-xs rounded-lg border px-sm-extra py-sm-extra",
            item.done
                ? "border-neutral-dimmed bg-neutral-base"
                : "border-dashed border-neutral-muted bg-neutral-subtle"
        )}
    >
        <div className="flex items-center gap-xs">
            {item.done ? (
                <StatusDot status="complete" />
            ) : (
                <Icon icon={<UpdateIcon />} label="Not yet" size="sm" color="neutral-light" />
            )}
            <Text size="md" className="font-semibold text-neutral-primary">
                {item.label}
            </Text>
            {item.note ? <Why note={item.note} /> : null}
        </div>
        <Text
            size="sm"
            className={cn(
                "font-semibold",
                item.done ? "text-success-strong" : "text-neutral-strong"
            )}
        >
            {item.state}
        </Text>
        {item.detail ? (
            <Text size="sm" className="text-neutral-strong">
                {item.detail}
            </Text>
        ) : null}
        {item.qualifier ? (
            <Text size="sm" className="font-medium text-neutral-primary">
                {item.qualifier}
            </Text>
        ) : null}
        {item.action ? (
            <Text size="sm" className="text-neutral-muted">
                {item.action}
            </Text>
        ) : null}
        {item.link ? (
            <span>
                <Button
                    variant="tertiary"
                    size="sm"
                    text={item.link.label}
                    onClick={() => window.open(item.link!.url, "_blank", "noopener")}
                />
            </span>
        ) : null}
    </div>
);

const QualityRow = ({
    label,
    sub,
    beta,
    items
}: {
    label: string;
    sub: string;
    beta?: boolean;
    items: QualityItem[];
}) => (
    <div className="grid grid-cols-1 gap-sm-extra border-b border-neutral-dimmed px-md py-sm-extra last:border-b-0 lg:grid-cols-[200px_repeat(3,minmax(0,1fr))]">
        <div className="flex flex-col gap-xxs pt-xxs">
            <div className="flex items-center gap-xs">
                <Text size="md" className="font-semibold text-neutral-primary">
                    {label}
                </Text>
                {beta ? <BetaBadge /> : null}
            </div>
            <Text size="sm" className="text-neutral-muted">
                {sub}
            </Text>
        </div>
        {items.map(item => (
            <QualityCard key={item.key} item={item} />
        ))}
    </div>
);

/**
 * The six qualities: facts counted from the published site, and passes applied in generation. Only the
 * facts carry the publish prompt; the passes come with generation, not with publishing.
 */
export const SiteQualities = createReactiveComponent(function SiteQualities({ presenter }: Props) {
    const { vm } = presenter;
    const result = vm.siteResult;
    if (!result) {
        return (
            <Panel className="px-md py-sm-extra">
                <Text size="sm" className="text-neutral-strong">
                    {vm.sitePageMapLoading
                        ? "Reading what the migration produced…"
                        : "What the migration produced could not be read."}
                </Text>
            </Panel>
        );
    }
    const groups = qualityGroups(result);
    const summary = qualitySummary(groups);
    return (
        <Panel>
            <PanelHeader bordered>
                <div className="flex flex-wrap items-baseline gap-sm-plus">
                    <Text size="lg" className="font-semibold text-neutral-primary">
                        What the migration produced
                    </Text>
                    <Text size="md" className="text-neutral-strong">
                        {summary.text}
                    </Text>
                </div>
                {summary.publishPrompt ? (
                    <div className="flex flex-wrap items-center gap-sm">
                        <Text size="sm" className="text-neutral-strong">
                            {summary.publishPrompt}
                        </Text>
                        <Button
                            variant="secondary"
                            size="sm"
                            text={vm.buildingSite ? "Publishing…" : "Publish again"}
                            icon={<PublishIcon />}
                            disabled={vm.buildingSite}
                            onClick={() => void presenter.buildSite()}
                        />
                    </div>
                ) : null}
            </PanelHeader>
            <QualityRow label="Facts" sub="Counted from the published site." items={groups.facts} />
            <QualityRow
                label="Passes applied in generation"
                sub="Beta: done by the pipeline, not yet checked."
                beta
                items={groups.passes}
            />
        </Panel>
    );
});

/** Merged across every row: the column (or the three pass columns) is not yet on any page. */
const NotYetBlock = ({ title, lines }: { title: string; lines: string[] }) => (
    <div className="flex flex-col items-start gap-xs">
        <Tag variant="neutral-light" icon={<UpdateIcon />} content={title} />
        {lines.map(line => (
            <Text key={line} size="sm" className="text-neutral-strong">
                {line}
            </Text>
        ))}
    </div>
);

/**
 * The site's pages, one row each, with what the migration did for each page in columns. A column
 * that is not yet on any page says so once, in a cell spanning every row.
 */
export const SitePagesTable = createReactiveComponent(function SitePagesTable({
    presenter
}: Props) {
    const { vm } = presenter;
    const map = vm.sitePageMap!;
    const tenantId = vm.site!.tenantId;
    const result = vm.siteResult;
    const byPath = new Map((result?.pages ?? []).map(page => [page.path, page]));
    const merged = result ? siteWideNotYet(result) : null;
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const [caveatOpen, setCaveatOpen] = useState(false);
    const [compared, setCompared] = useState<ComposedPageDto | null>(null);
    const comparedUrl = compared ? siteUrl(vm.websiteDomain, compared.path, tenantId) : null;

    const statuses = map.pages.map(page => composedStatus(page));
    const allCaveat = statuses.length > 0 && statuses.every(status => status === "caveat");
    const rows = map.pages.length;
    const view = (page: ComposedPageDto) => siteUrl(vm.websiteDomain, page.path, tenantId);

    return (
        <Panel>
            <PanelHeader>
                <Text size="lg" className="font-semibold text-neutral-primary">
                    {plural(rows, "page")}
                </Text>
                <Text size="sm" className="text-neutral-muted">
                    Pass columns: components on the page that carried the pass
                </Text>
            </PanelHeader>

            {allCaveat ? (
                <div className="flex flex-col border-t border-neutral-dimmed bg-neutral-subtle">
                    <div className="flex items-center gap-sm px-md py-xs">
                        <Icon icon={<InfoIcon />} label="Caveat" size="sm" color="neutral-light" />
                        <Text size="sm">All {plural(rows, "page")} composed, with a caveat</Text>
                        <span className="ml-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                text={caveatOpen ? "Hide" : "What it means"}
                                onClick={() => setCaveatOpen(!caveatOpen)}
                            />
                        </span>
                    </div>
                    {caveatOpen ? (
                        <Text
                            size="sm"
                            className="border-t border-neutral-dimmed px-md py-sm-plus pl-xl text-neutral-strong"
                        >
                            Something from the source page is missing from the composed page: a
                            section with no approved component, fewer sections than the source,
                            source text not found, or a link left empty. Each page&apos;s notes say
                            which.
                        </Text>
                    ) : null}
                </div>
            ) : null}

            <Table className="table-fixed">
                <Table.Header>
                    <Table.Row>
                        <Table.Head className="w-[26%] whitespace-normal align-bottom leading-tight">
                            Page
                        </Table.Head>
                        <Table.Head className="w-[12%] whitespace-normal align-bottom leading-tight">
                            Title &amp; description
                        </Table.Head>
                        <Table.Head className="w-[13%] whitespace-normal align-bottom leading-tight">
                            <Tooltip
                                content="Image files this page's components use. An image two pages share counts on each, so the rows add up to more than the site's files."
                                trigger={<span className="cursor-default">Images</span>}
                            />
                        </Table.Head>
                        {PASSES.map(pass => (
                            <Table.Head
                                key={pass}
                                className="w-[13%] whitespace-normal align-bottom leading-tight"
                            >
                                <span className="inline-flex flex-wrap items-center gap-xs">
                                    {pass === "responsiveness" ? (
                                        <Tooltip
                                            content={RESPONSIVENESS_NOTE}
                                            trigger={
                                                <span className="cursor-default underline decoration-dotted">
                                                    Responsiveness
                                                </span>
                                            }
                                        />
                                    ) : (
                                        PASS_LABEL[pass].replace(" pass", "")
                                    )}
                                    <BetaBadge />
                                </span>
                            </Table.Head>
                        ))}
                        <Table.Head className="w-[136px] whitespace-normal align-bottom leading-tight">
                            {""}
                        </Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {map.pages.map((page, index) => {
                        const pageResult = byPath.get(page.path);
                        const cells = pageResult ? pageCells(pageResult) : null;
                        const status = statuses[index]!;
                        const reasons =
                            status === "caveat" && page.signals ? caveatReasons(page.signals) : [];
                        const url = view(page);
                        const live = vm.siteLivePageByPath[page.path];
                        // Undefined: not answered yet. Null or another id: a visitor reaches a different page.
                        const notLive = live !== undefined && live !== page.pageId;
                        const first = index === 0;
                        const noteOpen = Boolean(open[page.path]);
                        return (
                            <Table.Row key={page.path}>
                                <Table.Cell
                                    truncate={false}
                                    className="align-top whitespace-normal leading-normal"
                                >
                                    <div className="flex min-w-0 flex-col gap-xxs">
                                        <Text className="truncate" title={page.title}>
                                            {page.title || page.path}
                                        </Text>
                                        {/* One line: the path gives way, the notes stay beside it. */}
                                        <span className="flex min-w-0 items-center gap-xs">
                                            <Text
                                                size="sm"
                                                className="min-w-0 truncate font-mono text-neutral-muted"
                                                title={`${page.sourceUrl} → ${page.path}`}
                                            >
                                                {page.path}
                                            </Text>
                                            <span className="flex flex-shrink-0 items-center gap-xs">
                                                {status !== "composed" &&
                                                !(allCaveat && status === "caveat") ? (
                                                    <Tag
                                                        variant={
                                                            STATUS_TAG[status].variant as never
                                                        }
                                                        content={STATUS_TAG[status].content}
                                                    />
                                                ) : null}
                                                {notLive ? (
                                                    <Tag
                                                        variant={"warning" as never}
                                                        content="not the live page"
                                                    />
                                                ) : null}
                                                {reasons.length > 0 ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        text={plural(reasons.length, "note")}
                                                        icon={
                                                            noteOpen ? (
                                                                <ExpandLessIcon />
                                                            ) : (
                                                                <ExpandMoreIcon />
                                                            )
                                                        }
                                                        iconPosition="end"
                                                        onClick={() =>
                                                            setOpen({
                                                                ...open,
                                                                [page.path]: !noteOpen
                                                            })
                                                        }
                                                    />
                                                ) : null}
                                            </span>
                                        </span>
                                        {noteOpen ? (
                                            <ul className="m-0 flex list-disc flex-col gap-xxs pl-md">
                                                {reasons.map(reason => (
                                                    <li key={reason}>
                                                        <Text
                                                            size="sm"
                                                            className="text-neutral-strong"
                                                        >
                                                            {reason}
                                                        </Text>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>
                                </Table.Cell>

                                {merged?.seo ? (
                                    first ? (
                                        <Table.Cell
                                            truncate={false}
                                            rowSpan={rows}
                                            className="align-top whitespace-normal leading-normal"
                                        >
                                            <NotYetBlock
                                                title="Not yet"
                                                lines={[
                                                    "Arrives when you publish again.",
                                                    "Published before this was added."
                                                ]}
                                            />
                                        </Table.Cell>
                                    ) : null
                                ) : (
                                    <Table.Cell
                                        truncate={false}
                                        className="align-top whitespace-normal leading-normal"
                                    >
                                        {cells ? <CellValue cell={cells.seo} /> : "–"}
                                    </Table.Cell>
                                )}

                                <Table.Cell
                                    truncate={false}
                                    className="align-top whitespace-normal leading-normal"
                                >
                                    {cells ? <CellValue cell={cells.images} /> : "–"}
                                </Table.Cell>

                                {merged?.allPasses ? (
                                    first ? (
                                        <Table.Cell
                                            truncate={false}
                                            colSpan={3}
                                            rowSpan={rows}
                                            className="align-top whitespace-normal leading-normal"
                                        >
                                            <NotYetBlock
                                                title="Passes not yet on this site"
                                                lines={[PASSES_NOT_YET, PASSES_ACTION]}
                                            />
                                        </Table.Cell>
                                    ) : null
                                ) : (
                                    PASSES.map(pass =>
                                        merged?.passes[pass] ? (
                                            first ? (
                                                <Table.Cell
                                                    truncate={false}
                                                    key={pass}
                                                    rowSpan={rows}
                                                    className="align-top whitespace-normal leading-normal"
                                                >
                                                    <NotYetBlock
                                                        title="Not yet on this site"
                                                        lines={[]}
                                                    />
                                                </Table.Cell>
                                            ) : null
                                        ) : (
                                            <Table.Cell
                                                truncate={false}
                                                key={pass}
                                                className="align-top whitespace-normal leading-normal"
                                            >
                                                {cells ? (
                                                    <CellValue cell={cells.passes[pass]} />
                                                ) : (
                                                    "–"
                                                )}
                                            </Table.Cell>
                                        )
                                    )
                                )}

                                <Table.Cell
                                    truncate={false}
                                    className="align-top whitespace-normal leading-normal text-right"
                                >
                                    <div className="flex flex-col items-end gap-xs">
                                        <Button
                                            variant="tertiary"
                                            size="sm"
                                            text="View page"
                                            disabled={!url}
                                            title={
                                                url ??
                                                "Website Builder has no preview domain set, so there is no address to open this page at."
                                            }
                                            onClick={() =>
                                                url && window.open(url, "_blank", "noopener")
                                            }
                                        />
                                        <Button
                                            variant="tertiary"
                                            size="sm"
                                            text="Compare page"
                                            disabled={!url}
                                            title={
                                                url
                                                    ? "The original page and the generated page side by side"
                                                    : "Website Builder has no preview domain set, so there is no address to open this page at."
                                            }
                                            onClick={() => setCompared(page)}
                                        />
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table>
            {compared && comparedUrl ? (
                <ComparePageView
                    runId={vm.run?.id ?? ""}
                    title={compared.title || compared.path}
                    sourceUrl={compared.sourceUrl}
                    generatedUrl={comparedUrl}
                    screenshotRef={vm.siteSourceScreenshots[compared.sourceUrl]}
                    onClose={() => setCompared(null)}
                />
            ) : null}
        </Panel>
    );
});
