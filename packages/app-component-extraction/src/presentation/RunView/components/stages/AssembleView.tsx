import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type {
    AssembleArtifactDto,
    AssembledPageDto,
    ComponentInstanceDto
} from "~/shared/types.js";

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

/** Sections detected on the page beyond the matched instances were kept as raw HTML. */
const rawHtmlCount = (page: AssembledPageDto): number =>
    Math.max(0, (page.totalSections ?? page.instances.length) - page.instances.length);

/** The prop values of one instance, rendered compactly as `name: "value"` pairs. */
const propSummary = (propValues: Record<string, string>): string =>
    Object.entries(propValues)
        .map(([name, value]) => `${name}: ${JSON.stringify(value)}`)
        .join(" · ");

const InstanceRow = ({ order, instance }: { order: number; instance: ComponentInstanceDto }) => (
    <div className="grid grid-cols-[32px_minmax(0,1fr)_minmax(0,2fr)] items-start gap-sm border-t border-neutral-dimmed px-sm py-xs">
        <Text size="sm" className="text-neutral-strong">
            {order}
        </Text>
        <Text size="sm" className="truncate font-mono">
            {instance.componentName}
        </Text>
        <Text
            size="sm"
            className="truncate text-neutral-strong"
            title={propSummary(instance.propValues)}
        >
            {propSummary(instance.propValues) || "—"}
        </Text>
    </div>
);

/** A framed preview box with a caption beneath (spec §6.8 side-by-side pair). */
const Preview = ({
    caption,
    surface,
    children
}: {
    caption: string;
    surface: "source" | "assembled";
    children: React.ReactNode;
}) => (
    <figure className="m-0 flex flex-col gap-xxs">
        <div
            className={`h-[190px] overflow-hidden rounded-sm border border-neutral-dimmed ${
                surface === "source" ? "bg-neutral-subtle" : "bg-neutral-base"
            }`}
        >
            {children}
        </div>
        <figcaption>
            <Text size="sm" className="text-neutral-strong">
                {caption}
            </Text>
        </figcaption>
    </figure>
);

const AssembledStack = ({ instances }: { instances: ComponentInstanceDto[] }) => (
    <div className="flex h-full flex-col gap-xxs overflow-y-auto p-xs">
        {instances.map((instance, index) => (
            <div
                key={`${instance.signature}-${instance.sectionIndex}`}
                className="flex flex-shrink-0 items-center gap-xs rounded-xs border border-neutral-dimmed bg-neutral-light px-xs py-xxs"
            >
                <Text size="sm" className="flex-shrink-0 text-neutral-strong">
                    {index + 1}
                </Text>
                <Text size="sm" className="truncate font-mono">
                    {instance.componentName}
                </Text>
            </div>
        ))}
    </div>
);

const AssembleCard = ({ page, runId }: { page: AssembledPageDto; runId: string }) => {
    const rawHtml = rawHtmlCount(page);
    return (
        <div className="flex flex-col rounded-lg border border-neutral-dimmed bg-neutral-base">
            <div className="flex items-center justify-between gap-sm border-b border-neutral-dimmed px-md py-sm">
                <Text size="sm" className="truncate font-mono">
                    {pathOf(page.url)}
                </Text>
                {rawHtml > 0 ? (
                    <Tag
                        variant="warning"
                        content={`${rawHtml} section${rawHtml === 1 ? "" : "s"} kept as raw HTML`}
                    />
                ) : (
                    <Tag variant="success-light" content="All sections matched" />
                )}
            </div>

            <div className="grid grid-cols-2 gap-sm p-md">
                <Preview caption="Original capture" surface="source">
                    {page.screenshotRef ? (
                        <RunImage
                            runId={runId}
                            imageRef={page.screenshotRef}
                            alt="original capture"
                            className="h-full w-full object-contain object-top"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <Text size="sm" className="text-neutral-strong">
                                no capture
                            </Text>
                        </div>
                    )}
                </Preview>
                <Preview caption="Assembled Webiny page" surface="assembled">
                    <AssembledStack instances={page.instances} />
                </Preview>
            </div>

            <div className="border-t border-neutral-dimmed">
                {page.instances.map((instance, index) => (
                    <InstanceRow
                        key={`${instance.signature}-${instance.sectionIndex}`}
                        order={index + 1}
                        instance={instance}
                    />
                ))}
            </div>
        </div>
    );
};

/**
 * The Assemble view (spec §6.8). One card per page: the path header with a match line ("All sections
 * matched" or "N sections kept as raw HTML"), the original capture beside the assembled page (a stack of
 * the placed components in document order — Assemble does not render the page, so the stack stands in for
 * a screenshot), then the ordered instance table (order · component name · prop values).
 */
export const AssembleView = createReactiveComponent(function AssembleView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as AssembleArtifactDto | null;
    const runId = vm.run?.id ?? "";

    if (vm.artifactLoading && !artifact) {
        return <Text className="p-md text-neutral-strong">Loading assembly…</Text>;
    }
    if (!artifact?.pages?.length) {
        return (
            <Text className="p-md text-neutral-strong">
                Run Assemble to place components into pages.
            </Text>
        );
    }

    const rawTotal = artifact.pages.reduce((sum, page) => sum + rawHtmlCount(page), 0);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-neutral-dimmed px-md py-sm">
                <Text size="sm" className="text-neutral-strong">
                    {artifact.pages.length} page{artifact.pages.length === 1 ? "" : "s"} assembled
                    {rawTotal > 0
                        ? ` · ${rawTotal} section${rawTotal === 1 ? "" : "s"} kept as raw HTML`
                        : " · all sections matched"}
                </Text>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-md">
                <div className="flex flex-col gap-md">
                    {artifact.pages.map(page => (
                        <AssembleCard key={page.url} page={page} runId={runId} />
                    ))}
                </div>
            </div>
        </div>
    );
});
