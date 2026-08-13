import React, { useMemo } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type {
    GenerateArtifactDto,
    GeneratedComponentDto,
    RenderRecordDto
} from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const validationOf = (component: GeneratedComponentDto) => {
    const v = component.validation;
    return [
        { label: "text", passed: v.textPreservation.passed },
        { label: "contract", passed: v.contractConformance.passed },
        { label: "tokens", passed: v.tokenBinding.passed }
    ];
};

/**
 * The Generate view (W7.7 slice). Lists the generated components with their validation status and, once
 * the render pass has run, the component's rendered screenshot. The full side-by-side comparison against
 * the source section (§6.7) lands in W7.8; this establishes the render trigger and the image plumbing.
 */
export const GenerateView = createReactiveComponent(function GenerateView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as GenerateArtifactDto | null;
    const runId = vm.run?.id ?? "";

    const rendersBySignature = useMemo(() => {
        const map = new Map<string, RenderRecordDto>();
        for (const record of vm.renders ?? []) {
            map.set(record.signature, record);
        }
        return map;
    }, [vm.renders]);

    if (vm.artifactLoading && !artifact) {
        return <Text className="p-md text-neutral-strong">Loading generated components…</Text>;
    }
    if (!artifact || artifact.components.length === 0) {
        return (
            <Text className="p-md text-neutral-strong">Run Generate to produce components.</Text>
        );
    }

    const rendered = (vm.renders ?? []).filter(record => record.ok).length;

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between gap-sm px-md py-sm border-b border-neutral-dimmed">
                <Text size="sm" className="text-neutral-strong">
                    {artifact.components.length} generated · {artifact.failed.length} failed
                    validation · {rendered} rendered
                </Text>
                <Button
                    variant="secondary"
                    size="sm"
                    text={vm.rendering ? "Rendering…" : "Render previews"}
                    disabled={vm.rendering}
                    onClick={() => void presenter.renderComponents()}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-md">
                <div className="grid grid-cols-3 gap-md">
                    {artifact.components.map(component => {
                        const render = rendersBySignature.get(component.signature);
                        return (
                            <div
                                key={component.signature}
                                className="flex flex-col rounded-sm overflow-hidden border border-neutral-dimmed"
                            >
                                <div className="aspect-[4/3] bg-neutral-light overflow-hidden flex items-center justify-center">
                                    {render && render.ok && render.renderRef ? (
                                        <RunImage
                                            runId={runId}
                                            imageRef={render.renderRef}
                                            alt={component.name}
                                            className="w-full h-full object-contain object-top"
                                        />
                                    ) : (
                                        <Text size="sm" className="text-neutral-strong">
                                            {render && !render.ok
                                                ? "render failed"
                                                : "not rendered"}
                                        </Text>
                                    )}
                                </div>
                                <div className="p-sm flex flex-col gap-xs">
                                    <Text size="sm" className="font-medium truncate">
                                        {component.name}
                                    </Text>
                                    <Text size="sm" className="font-mono text-neutral-strong">
                                        {component.type}
                                    </Text>
                                    <div className="flex flex-wrap gap-xxs">
                                        {validationOf(component).map(check => (
                                            <Tag
                                                key={check.label}
                                                variant={
                                                    check.passed ? "success-light" : "destructive"
                                                }
                                                content={check.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
