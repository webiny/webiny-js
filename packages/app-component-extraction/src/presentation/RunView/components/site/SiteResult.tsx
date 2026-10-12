import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import {
    BetaBadge,
    Button,
    Card,
    cn,
    Heading,
    Icon,
    Table,
    Tag,
    Text,
    Tooltip
} from "@webiny/admin-ui";
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
        <Card padding="lg" elevation="small">
            <div className="flex flex-col gap-md">
                <div className="flex flex-wrap items-start justify-between gap-md">
                    <div className="flex min-w-0 flex-col gap-xs">
                        <span>
                            <Tag variant="success-light" content="Published" />
                        </span>
                        <Heading level={3}>
                            {plural(pages, "page")}, live in their own tenant
                        </Heading>
                        <Text size="sm" className="text-neutral-strong">
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
                <div className="grid grid-cols-2 rounded-md border border-neutral-dimmed lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className={cn(
                                "flex min-w-0 flex-col gap-xxs px-md py-sm",
                                index < stats.length - 1 && "lg:border-r lg:border-neutral-dimmed"
                            )}
                            title={stat.title}
                        >
                            <Text size="sm" className="font-semibold uppercase text-neutral-muted">
                                {stat.label}
                            </Text>
                            <Heading level={5}>{stat.value}</Heading>
                            <Text size="sm" className="truncate text-neutral-strong">
                                {stat.sub}
                            </Text>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
});

const QualityCard = ({ item }: { item: QualityItem }) => (
    <div
        className={cn(
            "flex min-w-0 flex-col gap-xxs rounded-md border border-neutral-dimmed px-sm py-sm",
            item.done ? "bg-neutral-base" : "bg-neutral-subtle"
        )}
    >
        <div className="flex items-center gap-xs">
            {item.done ? (
                <StatusDot status="complete" />
            ) : (
                <Icon icon={<UpdateIcon />} label="Not yet" size="sm" color="neutral-light" />
            )}
            <Text size="sm" className="font-semibold">
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
    <div className="grid grid-cols-1 gap-sm border-t border-neutral-dimmed px-md py-sm lg:grid-cols-[180px_repeat(3,minmax(0,1fr))]">
        <div className="flex flex-col gap-xxs">
            <div className="flex items-center gap-xs">
                <Text size="sm" className="font-semibold">
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
            <Card padding="md" elevation="small">
                <Text size="sm" className="text-neutral-strong">
                    {vm.sitePageMapLoading
                        ? "Reading what the migration produced…"
                        : "What the migration produced could not be read."}
                </Text>
            </Card>
        );
    }
    const groups = qualityGroups(result);
    const summary = qualitySummary(groups);
    return (
        <Card padding="md" elevation="small" bodyPadding={false}>
            <div className="flex flex-wrap items-center justify-between gap-sm px-md pb-sm">
                <div className="flex flex-wrap items-baseline gap-sm">
                    <Heading level={5}>What the migration produced</Heading>
                    <Text size="sm" className="text-neutral-strong">
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
            </div>
            <QualityRow label="Facts" sub="Counted from the published site." items={groups.facts} />
            <QualityRow
                label="Passes applied in generation"
                sub="Beta: done by the pipeline, not yet checked."
                beta
                items={groups.passes}
            />
        </Card>
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

    const statuses = map.pages.map(page => composedStatus(page));
    const allCaveat = statuses.length > 0 && statuses.every(status => status === "caveat");
    const rows = map.pages.length;
    const view = (page: ComposedPageDto) => siteUrl(vm.websiteDomain, page.path, tenantId);

    return (
        <Card padding="md" elevation="small" bodyPadding={false}>
            <div className="flex flex-wrap items-baseline justify-between gap-sm px-md pb-sm">
                <Heading level={5}>{plural(rows, "page")}</Heading>
                <Text size="sm" className="text-neutral-muted">
                    Pass columns: components on the page that carried the pass
                </Text>
            </div>

            {allCaveat ? (
                <div className="flex flex-col border-t border-neutral-dimmed bg-neutral-subtle">
                    <div className="flex items-center gap-xs px-md py-xs">
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
                            className="border-t border-neutral-dimmed px-md py-xs text-neutral-strong"
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
                        <Table.Head className="w-[112px] whitespace-normal align-bottom leading-tight">
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
                                        <span className="flex flex-wrap items-center gap-xs">
                                            <Text
                                                size="sm"
                                                className="min-w-0 truncate font-mono text-neutral-muted"
                                                title={`${page.sourceUrl} → ${page.path}`}
                                            >
                                                {page.path}
                                            </Text>
                                            {status !== "composed" &&
                                            !(allCaveat && status === "caveat") ? (
                                                <Tag
                                                    variant={STATUS_TAG[status].variant as never}
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
                                                        setOpen({ ...open, [page.path]: !noteOpen })
                                                    }
                                                />
                                            ) : null}
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
                                </Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table>
        </Card>
    );
});
