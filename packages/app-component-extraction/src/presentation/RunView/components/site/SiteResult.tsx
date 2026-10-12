import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { BetaBadge, Button, Table, Tag, Text, Tooltip, Widget } from "@webiny/admin-ui";
import type { ComposedPageDto } from "~/shared/types.js";
import type { RunViewPresenter } from "../../abstractions.js";
import { composedStatus, STATUS_TAG } from "../composed/pageStatus.js";
import { siteUrl } from "./siteUrl.js";
import {
    type Cell,
    type Pass,
    PASS_LABEL,
    pageCells,
    RESPONSIVENESS_NOTE,
    siteWideLines
} from "./siteResultLines.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const PREVIEW_NOTE =
    "The preview address: the demo website with this site's tenant. The site's own domain is the source site's, once it points here.";

/** A value with its full sentence on hover; muted when it says something was not done. */
const CellText = ({ cell }: { cell: Cell }) => (
    <Tooltip
        content={cell.full}
        trigger={
            <span
                className={
                    cell.muted
                        ? "text-sm text-neutral-muted cursor-default"
                        : "text-sm text-neutral-primary cursor-default"
                }
            >
                {cell.label}
            </span>
        }
    />
);

/**
 * What the migration produced, site-wide: the first thing on the Site step. Each line says what the
 * pipeline did; a pass nothing checks carries the design system's beta badge; zero is said, with why.
 */
export const SiteResultSummary = createReactiveComponent(function SiteResultSummary({
    presenter
}: Props) {
    const { vm } = presenter;
    const site = vm.site;
    const published = site?.lastBuild?.status === "done";
    const lines = siteWideLines(published ? vm.siteResult : null);
    const viewUrl = site && published ? siteUrl(vm.websiteDomain, "/", site.tenantId) : null;

    return (
        <Widget
            title="Result"
            description="What the migration produced. Beta: done by the pipeline, not yet checked."
            elevation="sm"
            headerActions={
                viewUrl ? (
                    <Tooltip
                        content={PREVIEW_NOTE}
                        trigger={
                            <Button
                                variant="primary"
                                size="sm"
                                text="View site"
                                onClick={() => window.open(viewUrl, "_blank", "noopener")}
                            />
                        }
                    />
                ) : undefined
            }
        >
            <div className="flex flex-col gap-sm">
                {/* Published, and the result not read: say so, never fall back to the unpublished text. */}
                {published && !vm.siteResult ? (
                    <Text size="sm" className="text-neutral-muted">
                        {vm.sitePageMapLoading
                            ? "Reading the result…"
                            : "The site's result could not be read."}
                    </Text>
                ) : null}
                {(published && !vm.siteResult ? [] : lines).map(line => (
                    <div key={line.key} className="flex flex-wrap items-center gap-sm">
                        <Text
                            size="sm"
                            className={line.muted ? "text-neutral-muted" : "text-neutral-primary"}
                        >
                            {line.text}
                        </Text>
                        {line.beta ? <BetaBadge /> : null}
                        {line.note ? (
                            <Tooltip
                                content={line.note}
                                trigger={
                                    <span className="cursor-default text-sm text-neutral-muted underline decoration-dotted">
                                        why
                                    </span>
                                }
                            />
                        ) : null}
                        {line.link ? (
                            <Button
                                variant="tertiary"
                                size="sm"
                                text={line.link.label}
                                onClick={() => window.open(line.link!.url, "_blank", "noopener")}
                            />
                        ) : null}
                    </div>
                ))}
            </div>
        </Widget>
    );
});

const PASSES: Pass[] = ["accessibility", "performance", "responsiveness"];

/**
 * The site's pages, one row each, with what the migration did for each page in columns, so the eye
 * can run down a column. The beta badge sits on the column, not on every row.
 */
export const SiteResultPages = createReactiveComponent(function SiteResultPages({
    presenter
}: Props) {
    const { vm } = presenter;
    const map = vm.sitePageMap!;
    const tenantId = vm.site!.tenantId;
    const byPath = new Map((vm.siteResult?.pages ?? []).map(page => [page.path, page]));
    const view = (page: ComposedPageDto) => siteUrl(vm.websiteDomain, page.path, tenantId);

    return (
        <div className="flex flex-col gap-xs">
            <Text size="sm" className="font-medium">
                {map.pages.length} page{map.pages.length === 1 ? "" : "s"} on the site
            </Text>
            <Table bordered>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Page</Table.Head>
                        <Table.Head>Title &amp; description</Table.Head>
                        <Table.Head>Images</Table.Head>
                        {PASSES.map(pass => (
                            <Table.Head key={pass}>
                                <span className="inline-flex items-center gap-xs">
                                    {PASS_LABEL[pass].replace(" pass", "")}
                                    <BetaBadge />
                                    {pass === "responsiveness" ? (
                                        <Tooltip
                                            content={RESPONSIVENESS_NOTE}
                                            trigger={
                                                <span className="cursor-default text-neutral-muted underline decoration-dotted">
                                                    why
                                                </span>
                                            }
                                        />
                                    ) : null}
                                </span>
                            </Table.Head>
                        ))}
                        <Table.Head>{""}</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {map.pages.map(page => {
                        const result = byPath.get(page.path);
                        const cells = result ? pageCells(result) : null;
                        const tag = STATUS_TAG[composedStatus(page)];
                        const url = view(page);
                        const live = vm.siteLivePageByPath[page.path];
                        // Undefined: not answered yet. Null or another id: a visitor reaches a different page.
                        const notLive = live !== undefined && live !== page.pageId;
                        return (
                            <Table.Row key={page.path}>
                                <Table.Cell>
                                    <div className="flex min-w-0 flex-col gap-xxs">
                                        <Text className="truncate font-medium" title={page.title}>
                                            {page.title || page.path}
                                        </Text>
                                        <span className="flex flex-wrap items-center gap-xs">
                                            <Text
                                                size="sm"
                                                className="truncate font-mono text-neutral-strong"
                                                title={`${page.sourceUrl} → ${page.path}`}
                                            >
                                                {page.path}
                                            </Text>
                                            <Tag
                                                variant={tag.variant as never}
                                                content={tag.content}
                                            />
                                            {notLive ? (
                                                <Tag
                                                    variant={"warning" as never}
                                                    content="not the live page"
                                                />
                                            ) : null}
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    {cells ? <CellText cell={cells.seo} /> : "–"}
                                </Table.Cell>
                                <Table.Cell>
                                    {cells ? <CellText cell={cells.images} /> : "–"}
                                </Table.Cell>
                                {PASSES.map(pass => (
                                    <Table.Cell key={pass}>
                                        {cells ? <CellText cell={cells.passes[pass]} /> : "–"}
                                    </Table.Cell>
                                ))}
                                <Table.Cell>
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
        </div>
    );
});
