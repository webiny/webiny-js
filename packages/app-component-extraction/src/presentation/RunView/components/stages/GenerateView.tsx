import React, { useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Heading, Icon, Input, Tag, Text, cn } from "@webiny/admin-ui";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
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

/** The retry line (spec §6.7): first-attempt vs the number of automatic retries, "exhausted" at the cap. */
const retryLine = (component: GeneratedComponentDto): string => {
    const exhausted = !allPassed(component);
    if (component.attempts <= 1) {
        return "Generated on the first attempt";
    }
    const retries = component.attempts - 1;
    return `${retries} automatic retr${retries === 1 ? "y" : "ies"}${
        exhausted ? " — exhausted" : ""
    }`;
};

/** An assertion pill (spec §6.7): a green/red glyph chip; a failed one lists its actionable detail. */
const AssertionPill = ({ label, result }: { label: string; result: ValidationResultDto }) => (
    <div className="flex flex-col gap-xxs">
        <div
            className={cn(
                "flex items-center gap-xs rounded-sm px-sm py-xxs",
                result.passed
                    ? "bg-success-subtle text-success-strong"
                    : "bg-destructive-subtle text-destructive-strong"
            )}
        >
            <Icon
                icon={result.passed ? <CheckIcon /> : <CloseIcon />}
                label={result.passed ? "pass" : "fail"}
                size="sm"
            />
            <Text size="sm" className="font-medium">
                {label}
            </Text>
        </div>
        {!result.passed && result.failures.length > 0 ? (
            <ul className="m-0 list-none p-0 pl-sm">
                {result.failures.slice(0, 6).map((failure, index) => (
                    <li key={index}>
                        <Text size="sm" className="break-words font-mono text-destructive-strong">
                            {failure}
                        </Text>
                    </li>
                ))}
            </ul>
        ) : null}
    </div>
);

/** The visual-similarity score block (spec §6.7): a large mono number and a threshold-colored bar. */
const ScoreBlock = ({ value }: { value: number | null | undefined }) => {
    const has = value !== null && value !== undefined;
    const tone = !has
        ? { bar: "bg-neutral-muted", text: "text-neutral-strong" }
        : value >= 0.85
          ? { bar: "bg-success-strong", text: "text-success-strong" }
          : value >= 0.75
            ? { bar: "bg-warning-strong", text: "text-warning-strong" }
            : { bar: "bg-destructive-strong", text: "text-destructive-strong" };
    return (
        <div className="flex flex-col gap-xs rounded-sm border border-neutral-dimmed p-sm">
            <div className="flex items-center justify-between gap-sm">
                <Text size="sm" className="text-neutral-strong">
                    Visual similarity
                </Text>
                <Text className={cn("font-mono text-xl leading-none", tone.text)}>
                    {has ? value.toFixed(2) : "—"}
                </Text>
            </div>
            <div className="h-[4px] w-full overflow-hidden rounded-full bg-neutral-light">
                <div
                    className={cn("h-full rounded-full", tone.bar)}
                    style={{ width: `${has ? Math.round(value * 100) : 0}%` }}
                />
            </div>
        </div>
    );
};

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

    // Accepted / rejected cards carry the decision as a border (spec §6.7).
    const border =
        decision === "accepted"
            ? "border-success-strong"
            : decision === "rejected"
              ? "border-destructive-strong"
              : "border-neutral-dimmed";

    const toggle = (target: ComponentDecisionDto) =>
        void presenter.setDecision(component.signature, decision === target ? "none" : target);

    return (
        <div className={cn("flex flex-col rounded-lg border-2 bg-neutral-base", border)}>
            <div className="flex min-w-0">
                <div className="flex min-w-0 flex-1 flex-col gap-sm p-md">
                    <div className="flex items-start justify-between gap-sm">
                        <div className="min-w-0">
                            <Heading level={6}>
                                <span className="font-mono">{component.name}</span>
                            </Heading>
                            <Text size="sm" className="text-neutral-strong">
                                {pageCount} page{pageCount === 1 ? "" : "s"} · {component.type}
                            </Text>
                            <Text size="sm" className="text-neutral-strong">
                                {retryLine(component)}
                            </Text>
                        </div>
                        {decision === "accepted" ? (
                            <Tag variant="success-light" content="Accepted" />
                        ) : decision === "rejected" ? (
                            <Tag variant="destructive" content="Rejected" />
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-sm">
                        <figure className="m-0 flex flex-col gap-xxs">
                            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm bg-neutral-subtle">
                                {sourceCropRef ? (
                                    <RunImage
                                        runId={runId}
                                        imageRef={sourceCropRef}
                                        alt="source section"
                                        className="h-full w-full object-contain object-top"
                                    />
                                ) : (
                                    <Text size="sm" className="text-neutral-strong">
                                        no source crop
                                    </Text>
                                )}
                            </div>
                            <figcaption>
                                <Text size="sm" className="text-neutral-strong">
                                    Source
                                </Text>
                            </figcaption>
                        </figure>
                        <figure className="m-0 flex flex-col gap-xxs">
                            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm border border-neutral-dimmed bg-neutral-base">
                                {render && render.ok && render.renderRef ? (
                                    <RunImage
                                        runId={runId}
                                        imageRef={render.renderRef}
                                        alt="generated component"
                                        className="h-full w-full object-contain object-top"
                                    />
                                ) : (
                                    <Text size="sm" className="text-neutral-strong">
                                        {render && !render.ok ? "render failed" : "not rendered"}
                                    </Text>
                                )}
                            </div>
                            <figcaption>
                                <Text size="sm" className="text-neutral-strong">
                                    Rendered
                                </Text>
                            </figcaption>
                        </figure>
                    </div>
                </div>

                <div className="flex w-[280px] flex-shrink-0 flex-col gap-sm border-l border-neutral-dimmed p-md">
                    <AssertionPill
                        label="Text preserved"
                        result={component.validation.textPreservation}
                    />
                    <AssertionPill
                        label="Contract conformant"
                        result={component.validation.contractConformance}
                    />
                    <AssertionPill
                        label="Token binding"
                        result={component.validation.tokenBinding}
                    />
                    <ScoreBlock value={render?.similarity} />
                </div>
            </div>

            <div className="flex flex-col gap-sm border-t border-neutral-dimmed px-md py-sm">
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
                            placeholder="Instruction, then regenerate — e.g. make the heading larger"
                            onEnter={submitRegenerate}
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            text="Regenerate"
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
 * The Generate view (spec §6.7). One card per component, most-used first: the source section beside the
 * rendered component, the validators kept visually distinct as green/red assertion pills plus a bordered
 * visual-similarity score block, and an accept/reject decision that gates Promotion. The summary reports
 * the decision state (accepted / rejected / undecided). "View code" shows the generated source; renders
 * are triggered from here; regenerate-with-instruction is tracked separately.
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

    const isAccepted = (component: GeneratedComponentDto) =>
        vm.decisions[component.signature] === "accepted";
    const isRejected = (component: GeneratedComponentDto) =>
        vm.decisions[component.signature] === "rejected";
    const accepted = sorted.filter(isAccepted).length;
    const rejected = sorted.filter(isRejected).length;
    const undecided = sorted.length - accepted - rejected;

    // "Accept passed" targets only the validation-passing components; "Accept all" targets every one.
    const passed = sorted.filter(allPassed);
    const passedAllAccepted = passed.length > 0 && passed.every(isAccepted);
    const allAccepted = sorted.length > 0 && sorted.every(isAccepted);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between gap-sm border-b border-neutral-dimmed px-md py-sm">
                <Text size="sm" className="text-neutral-strong">
                    {accepted} accepted · {rejected} rejected · {undecided} undecided · sorted by
                    page count
                </Text>
                <div className="flex flex-shrink-0 items-center gap-sm">
                    <Button
                        variant="secondary"
                        size="sm"
                        text={
                            passedAllAccepted
                                ? "Passing accepted"
                                : `Accept all passing (${passed.length})`
                        }
                        disabled={passed.length === 0 || passedAllAccepted}
                        title="Accept only the components that passed every validator"
                        onClick={() =>
                            void presenter.acceptAll(passed.map(component => component.signature))
                        }
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        text={allAccepted ? "All accepted" : `Accept all (${sorted.length})`}
                        disabled={sorted.length === 0 || allAccepted}
                        title="Accept every generated component, including those with failing validators"
                        onClick={() =>
                            void presenter.acceptAll(sorted.map(component => component.signature))
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

            <div className="min-h-0 flex-1 overflow-y-auto p-md">
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-xl"
                    onClick={() => setCodeFor(null)}
                >
                    <div
                        className="max-h-full w-full max-w-[900px] overflow-y-auto rounded-sm bg-neutral-base"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-neutral-dimmed px-md py-sm">
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
                        <div className="flex flex-col gap-md p-md">
                            <div>
                                <Text size="sm" className="font-medium">
                                    Source
                                </Text>
                                <pre className="mt-xs whitespace-pre-wrap break-words font-mono text-sm">
                                    {codeFor.source}
                                </pre>
                            </div>
                            {codeFor.css ? (
                                <div>
                                    <Text size="sm" className="font-medium">
                                        CSS
                                    </Text>
                                    <pre className="mt-xs whitespace-pre-wrap break-words font-mono text-sm">
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
