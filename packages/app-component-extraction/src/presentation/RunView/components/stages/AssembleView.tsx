import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Tag, Text } from "@webiny/admin-ui";
import type { RunViewPresenter } from "../../abstractions.js";
import type { AssembleArtifactDto, ComponentInstanceDto } from "~/shared/types.js";

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

/** The prop values of one instance, rendered compactly as `name: "value"` pairs. */
const propSummary = (propValues: Record<string, string>): string =>
    Object.entries(propValues)
        .map(([name, value]) => `${name}: ${JSON.stringify(value)}`)
        .join(" · ");

const InstanceRow = ({ order, instance }: { order: number; instance: ComponentInstanceDto }) => (
    <div className="grid grid-cols-[40px_1fr_2fr] items-start gap-sm border-b border-neutral-dimmed py-xs last:border-b-0">
        <Text size="sm" className="text-neutral-strong">
            {order}
        </Text>
        <Text size="sm" className="truncate font-mono">
            {instance.componentName}
        </Text>
        <Text size="sm" className="truncate text-neutral-strong">
            {propSummary(instance.propValues) || "—"}
        </Text>
    </div>
);

/**
 * The Assemble view (spec §6.8). One card per page: the path header with a match line, then the ordered
 * instance table (order · component name · prop values). The design also shows original/assembled previews
 * side by side, but the assemble artifact carries no assembled-page screenshot — that would need Assemble
 * to render and capture the page (a backend addition, noted for later); the instance table is the artifact.
 */
export const AssembleView = createReactiveComponent(function AssembleView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as AssembleArtifactDto | null;

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

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-neutral-dimmed px-md py-sm">
                <Text size="sm" className="text-neutral-strong">
                    {artifact.pages.length} page(s) assembled
                </Text>
            </div>
            <div className="flex-1 overflow-y-auto p-md">
                <div className="flex flex-col gap-md">
                    {artifact.pages.map(page => (
                        <div
                            key={page.url}
                            className="rounded-lg border border-neutral-dimmed bg-neutral-base"
                        >
                            <div className="flex items-center justify-between gap-sm border-b border-neutral-dimmed px-md py-sm">
                                <Text size="sm" className="truncate font-mono">
                                    {pathOf(page.url)}
                                </Text>
                                <Tag
                                    variant="success-light"
                                    content={`${page.instances.length} components placed`}
                                />
                            </div>
                            <div className="px-md py-sm">
                                {page.instances.map((instance, index) => (
                                    <InstanceRow
                                        key={`${instance.signature}-${instance.sectionIndex}`}
                                        order={index + 1}
                                        instance={instance}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});
