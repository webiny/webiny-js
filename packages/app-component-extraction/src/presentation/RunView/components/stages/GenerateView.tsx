import React, { useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Heading, Input, Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type {
    ComponentDecisionDto,
    GenerateArtifactDto,
    GeneratedComponentDto,
    RenderRecordDto,
    ValidationResultDto
} from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const pageCountOf = (component: GeneratedComponentDto): number =>
    new Set(component.members.map(member => member.url)).size;

const allPassed = (component: GeneratedComponentDto): boolean => {
    const v = component.validation;
    return v.textPreservation.passed && v.contractConformance.passed && v.tokenBinding.passed;
};

/** A pass/fail assertion pill with its failure detail listed when it failed (the detail is actionable). */
const AssertionPill = ({ label, result }: { label: string; result: ValidationResultDto }) => (
    <div className="flex flex-col gap-xxs">
        <div className="flex items-center justify-between gap-sm">
            <Text size="sm">{label}</Text>
            <Tag
                variant={result.passed ? "success-light" : "destructive"}
                content={result.passed ? "pass" : "fail"}
            />
        </div>
        {!result.passed && result.failures.length > 0 ? (
            <ul className="list-none m-0 p-0">
                {result.failures.slice(0, 6).map((failure, index) => (
                    <li key={index}>
                        <Text size="sm" className="font-mono text-destructive-default break-words">
                            {failure}
                        </Text>
                    </li>
                ))}
            </ul>
        ) : null}
    </div>
);

/** The visual-similarity indicator — a coarse number, deliberately labelled "indicator", not a score. */
const SimilarityIndicator = ({ value }: { value: number | null | undefined }) => (
    <div className="flex items-center justify-between gap-sm">
        <Text size="sm">Visual similarity</Text>
        <Tag
            variant="neutral-muted"
            content={
                value === null || value === undefined
                    ? "—"
                    : `~${Math.round(value * 100)}% indicator`
            }
        />
    </div>
);

const GenerateCard = ({
    presenter,
    component,
    render,
    sourceCropRef,
    decision,
    regenerating,
    runId,
    onViewCode
}: {
    presenter: RunViewPresenter.Interface;
    component: GeneratedComponentDto;
    render: RenderRecordDto | undefined;
    sourceCropRef: string | undefined;
    decision: ComponentDecisionDto | undefined;
    regenerating: boolean;
    runId: string;
    onViewCode: () => void;
}) => {
    const pageCount = pageCountOf(component);
    const exhausted = !allPassed(component);
    const [showInstruction, setShowInstruction] = useState(false);
    const [instruction, setInstruction] = useState("");

    const submitRegenerate = () => {
        const text = instruction.trim();
        if (!text) {
            return;
        }
        void presenter.regenerateComponent(component.signature, text);
        setInstruction("");
        setShowInstruction(false);
    };

    // Accepted / rejected cards carry the decision as a border (per the screen specification).
    const border =
        decision === "accepted"
            ? "border-success-default"
            : decision === "rejected"
              ? "border-destructive-default"
              : "border-neutral-dimmed";

    const toggle = (target: ComponentDecisionDto) =>
        void presenter.setDecision(component.signature, decision === target ? "none" : target);

    return (
        <div className={`flex flex-col rounded-sm border-2 ${border}`}>
            <div className="flex min-w-0">
                <div className="flex-1 min-w-0 p-md flex flex-col gap-sm">
                    <div>
                        <Heading level={6}>
                            <span className="font-mono">{component.name}</span>
                        </Heading>
                        <Text size="sm" className="text-neutral-strong">
                            {pageCount} page(s) · {component.type}
                        </Text>
                        <Text size="sm" className="text-neutral-strong">
                            {component.attempts} generation attempt(s)
                            {exhausted ? " · retries exhausted" : ""}
                        </Text>
                    </div>

                    <div className="grid grid-cols-2 gap-sm">
                        <figure className="m-0 flex flex-col gap-xxs">
                            <div className="aspect-[4/3] bg-neutral-light rounded-sm overflow-hidden flex items-center justify-center">
                                {sourceCropRef ? (
                                    <RunImage
                                        runId={runId}
                                        imageRef={sourceCropRef}
                                        alt="source section"
                                        className="w-full h-full object-contain object-top"
                                    />
                                ) : (
                                    <Text size="sm" className="text-neutral-strong">
                                        no source crop
                                    </Text>
                                )}
                            </div>
                            <figcaption>
                                <Text size="sm" className="text-neutral-strong">
                                    source
                                </Text>
                            </figcaption>
                        </figure>
                        <figure className="m-0 flex flex-col gap-xxs">
                            <div className="aspect-[4/3] bg-neutral-light rounded-sm overflow-hidden flex items-center justify-center">
                                {render && render.ok && render.renderRef ? (
                                    <RunImage
                                        runId={runId}
                                        imageRef={render.renderRef}
                                        alt="generated component"
                                        className="w-full h-full object-contain object-top"
                                    />
                                ) : (
                                    <Text size="sm" className="text-neutral-strong">
                                        {render && !render.ok ? "render failed" : "not rendered"}
                                    </Text>
                                )}
                            </div>
                            <figcaption>
                                <Text size="sm" className="text-neutral-strong">
                                    generated
                                </Text>
                            </figcaption>
                        </figure>
                    </div>
                </div>

                <div className="w-[260px] flex-shrink-0 border-l border-neutral-dimmed p-md flex flex-col gap-sm">
                    <AssertionPill
                        label="Text preservation"
                        result={component.validation.textPreservation}
                    />
                    <AssertionPill
                        label="Contract conformance"
                        result={component.validation.contractConformance}
                    />
                    <AssertionPill
                        label="Token binding"
                        result={component.validation.tokenBinding}
                    />
                    <SimilarityIndicator value={render?.similarity} />
                </div>
            </div>

            <div className="flex flex-col gap-sm px-md py-sm border-t border-neutral-dimmed">
                <div className="flex items-center gap-sm">
                    <Button
                        variant={decision === "accepted" ? "primary" : "secondary"}
                        size="sm"
                        text="Accept"
                        onClick={() => toggle("accepted")}
                    />
                    <Button
                        variant={decision === "rejected" ? "primary" : "secondary"}
                        size="sm"
                        text="Reject"
                        onClick={() => toggle("rejected")}
                    />
                    <Button variant="tertiary" size="sm" text="View code" onClick={onViewCode} />
                    <div className="flex-1" />
                    <Button
                        variant="tertiary"
                        size="sm"
                        text={
                            regenerating
                                ? "Regenerating…"
                                : showInstruction
                                  ? "Cancel"
                                  : "Regenerate"
                        }
                        disabled={regenerating}
                        onClick={() => setShowInstruction(open => !open)}
                    />
                </div>
                {showInstruction && !regenerating ? (
                    <div className="flex items-center gap-sm">
                        <Input
                            value={instruction}
                            onChange={(value: string) => setInstruction(value)}
                            placeholder="What should change? e.g. make the heading larger"
                            onEnter={submitRegenerate}
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            text="Submit"
                            disabled={!instruction.trim()}
                            onClick={submitRegenerate}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

/**
 * The Generate view (W7.8). One card per component, most-used first: the source section beside the
 * rendered component, the three validators kept visually distinct (two assertion pills plus the token
 * pill) with actionable failure detail, a coarse visual-similarity indicator, and an accept/reject
 * decision that gates Promotion. "View code" shows the generated source; the render pass is triggered
 * from here (W7.7). Regenerate-with-instruction is the one remaining action, tracked separately.
 */
export const GenerateView = createReactiveComponent(function GenerateView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as GenerateArtifactDto | null;
    const runId = vm.run?.id ?? "";
    const [codeFor, setCodeFor] = useState<GeneratedComponentDto | null>(null);

    const rendersBySignature = useMemo(() => {
        const map = new Map<string, RenderRecordDto>();
        for (const record of vm.renders ?? []) {
            map.set(record.signature, record);
        }
        return map;
    }, [vm.renders]);

    // Most-used components first, so the highest-impact ones get the freshest attention.
    const sorted = useMemo(
        () => [...(artifact?.components ?? [])].sort((a, b) => pageCountOf(b) - pageCountOf(a)),
        [artifact]
    );

    if (vm.artifactLoading && !artifact?.components) {
        return <Text className="p-md text-neutral-strong">Loading generated components…</Text>;
    }
    if (!artifact?.components?.length) {
        return (
            <Text className="p-md text-neutral-strong">Run Generate to produce components.</Text>
        );
    }

    const rendered = (vm.renders ?? []).filter(record => record.ok).length;

    // Only validation-passing components can be promoted, so "Accept all" targets exactly those.
    const acceptable = sorted.filter(allPassed);
    const allAccepted =
        acceptable.length > 0 &&
        acceptable.every(component => vm.decisions[component.signature] === "accepted");

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between gap-sm px-md py-sm border-b border-neutral-dimmed">
                <Text size="sm" className="text-neutral-strong">
                    {artifact.components.length} generated · {artifact.failed.length} failed
                    validation · {rendered} rendered
                </Text>
                <div className="flex items-center gap-sm flex-shrink-0">
                    <Button
                        variant="secondary"
                        size="sm"
                        text={allAccepted ? "All accepted" : `Accept all (${acceptable.length})`}
                        disabled={acceptable.length === 0 || allAccepted}
                        title="Accept every component that passed validation"
                        onClick={() =>
                            void presenter.acceptAll(
                                acceptable.map(component => component.signature)
                            )
                        }
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        text={vm.rendering ? "Rendering…" : "Render previews"}
                        disabled={vm.rendering}
                        onClick={() => void presenter.renderComponents()}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-md">
                <div className="flex flex-col gap-md">
                    {sorted.map(component => (
                        <GenerateCard
                            key={component.signature}
                            presenter={presenter}
                            component={component}
                            render={rendersBySignature.get(component.signature)}
                            sourceCropRef={vm.sourceCrops[component.signature]}
                            decision={vm.decisions[component.signature]}
                            regenerating={vm.regenerating.includes(component.signature)}
                            runId={runId}
                            onViewCode={() => setCodeFor(component)}
                        />
                    ))}
                </div>
            </div>

            {codeFor ? (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-xl"
                    onClick={() => setCodeFor(null)}
                >
                    <div
                        className="bg-neutral-base rounded-sm max-w-[900px] w-full max-h-full overflow-y-auto"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-md py-sm border-b border-neutral-dimmed">
                            <Heading level={6}>
                                <span className="font-mono">{codeFor.name}</span>
                            </Heading>
                            <Button
                                variant="tertiary"
                                size="sm"
                                text="Close"
                                onClick={() => setCodeFor(null)}
                            />
                        </div>
                        <div className="p-md flex flex-col gap-md">
                            <div>
                                <Text size="sm" className="font-medium">
                                    Source
                                </Text>
                                <pre className="mt-xs text-sm whitespace-pre-wrap break-words font-mono">
                                    {codeFor.source}
                                </pre>
                            </div>
                            {codeFor.css ? (
                                <div>
                                    <Text size="sm" className="font-medium">
                                        CSS
                                    </Text>
                                    <pre className="mt-xs text-sm whitespace-pre-wrap break-words font-mono">
                                        {codeFor.css}
                                    </pre>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
});
