import React, { useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Heading, Icon, Input, Tag, Text, cn } from "@webiny/admin-ui";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import { ReviewControl } from "./ReviewControl.js";
import { GenerationLog } from "./GenerationLog.js";
import type {
    GenerationLogState,
    GenerationPromptState,
    RunViewPresenter
} from "../../abstractions.js";
import type {
    ComponentDecisionDto,
    ComponentPromptDto,
    ComponentReviewDto,
    GenerateArtifactDto,
    GeneratedComponentDto,
    GeneratedComponentDetailDto,
    RenderRecordDto,
    ReviewOptionDto,
    ValidationResultDto
} from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

// Carried on the artifact rather than derived, because the aggregate references its components
// instead of holding their cluster members.
const pageCountOf = (component: GeneratedComponentDto): number => component.pageCount;

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
/**
 * What the render observed about the component's images.
 *
 * Deliberately NOT an AssertionPill. The three pills are gates: they run inside Generate and a
 * failure costs the component a retry. This runs afterwards, in the render, which Generate does not
 * wait on — so it cannot fail anything, and dressing it as a fourth pill would say it could. Making
 * it a gate means changing when Generate finishes, which is a decision about Generate's shape rather
 * than a consequence of adding a check.
 *
 * It exists because a broken image is invisible to all three: the bundle builds, the text is
 * preserved, the props conform and the colours are variables. Measured across five sites, 8 of the
 * 35 components that declare a file input emit a URL that cannot load, every one of them with three
 * green pills.
 */
const ImageFinding = ({ render }: { render: RenderRecordDto | undefined }) => {
    const check = render?.imageCheck;
    const stringified = check?.stringifiedValues ?? [];
    const failed = check?.failedRequests ?? [];
    const unused = check?.declaredButUnused ?? [];
    if (stringified.length === 0 && failed.length === 0 && unused.length === 0) {
        return null;
    }
    const headline =
        stringified.length > 0
            ? `${stringified.length} image value${stringified.length === 1 ? "" : "s"} stringified into a URL`
            : failed.length > 0
              ? `${failed.length} image${failed.length === 1 ? "" : "s"} failed to load`
              : `${unused.length} image${unused.length === 1 ? "" : "s"} shipped as a default and never shown`;
    return (
        <div className="mt-sm flex flex-col gap-xxs rounded-sm border border-dashed border-warning-default bg-warning-subtle px-sm py-xs">
            <Text size="sm" className="font-medium text-warning-strong">
                {`Render finding — ${headline}`}
            </Text>
            <Text size="sm" className="text-neutral-strong">
                Observed after generation, so it failed nothing above. A file input&apos;s value is
                an object; reading it bare puts &quot;[object Object]&quot; where a URL belongs.
            </Text>
            {[...stringified, ...failed, ...unused].slice(0, 3).map((line, index) => (
                <Text key={index} size="sm" className="truncate font-mono text-neutral-strong">
                    {line}
                </Text>
            ))}
        </div>
    );
};

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

/**
 * The render's size against its source section's.
 *
 * This replaced a visual-similarity score. The score was a 64x64 greyscale mean-absolute-difference,
 * and measured across 34 components on four sites it tracked average brightness and nothing else: it
 * gave 0.97 to a component rendered 8.1x taller than its section, 0.97 to a footer that had lost
 * every image, and 0.80 to the most faithful component in the set. Drawn here, beneath the three real
 * assertions and coloured green above 0.85, it certified the exact failures a reviewer needed to
 * find.
 *
 * What is left is measured rather than derived: two heights, and the ratio stated in words when they
 * diverge. No bar, no threshold colour — a reviewer who wants a verdict has the two images above, and
 * nothing here should let them skip looking.
 */
const SizeBlock = ({ render }: { render: RenderRecordDto | undefined }) => {
    const sourceHeight = render?.sourceHeight ?? null;
    const renderHeight = render?.height ?? null;
    const ratio = sourceHeight && renderHeight ? renderHeight / sourceHeight : null;
    // Outside this band the component is not the shape of its section, which is the single thing the
    // old number was worst at telling anyone.
    const diverges = ratio !== null && (ratio > 1.5 || ratio < 0.67);
    const widthMismatch =
        render?.sourceWidth != null && render.width > 0 && render.sourceWidth !== render.width;

    return (
        <div className="flex flex-col gap-xs rounded-sm border border-neutral-dimmed p-sm">
            <div className="flex items-center justify-between gap-sm">
                <Text size="sm" className="text-neutral-strong">
                    Section height
                </Text>
                <Text className="font-mono text-sm leading-none text-neutral-primary">
                    {sourceHeight === null ? "—" : `${sourceHeight}px`}
                </Text>
            </div>
            <div className="flex items-center justify-between gap-sm">
                <Text size="sm" className="text-neutral-strong">
                    Render height
                </Text>
                <Text className="font-mono text-sm leading-none text-neutral-primary">
                    {renderHeight === null ? "—" : `${renderHeight}px`}
                </Text>
            </div>
            {diverges && ratio !== null ? (
                <Text size="sm" className="text-neutral-strong">
                    {ratio > 1
                        ? `${ratio.toFixed(1)}x taller than its section`
                        : `${(1 / ratio).toFixed(1)}x shorter than its section`}
                </Text>
            ) : null}
            {widthMismatch ? (
                <Text size="sm" className="text-neutral-strong">
                    {`Rendered at ${render?.width}px against a ${render?.sourceWidth}px crop — the two are different layout widths.`}
                </Text>
            ) : null}
        </div>
    );
};

const GenerateCard = ({
    presenter,
    component,
    render,
    sourceCropRef,
    decision,
    review,
    reviewVerdicts,
    reviewReasons,
    reviewSaving,
    logOpen,
    logState,
    logPrompts,
    regenerating,
    renderingThis,
    runId,
    onViewCode
}: {
    presenter: RunViewPresenter.Interface;
    component: GeneratedComponentDto;
    render: RenderRecordDto | undefined;
    sourceCropRef: string | undefined;
    decision: ComponentDecisionDto | undefined;
    review: ComponentReviewDto | undefined;
    reviewVerdicts: ReviewOptionDto[];
    reviewReasons: ReviewOptionDto[];
    reviewSaving: boolean;
    logOpen: boolean;
    logState: GenerationLogState | undefined;
    logPrompts: Record<string, GenerationPromptState>;
    regenerating: boolean;
    renderingThis: boolean;
    runId: string;
    onViewCode: () => void;
}) => {
    const pageCount = pageCountOf(component);
    const [showInstruction, setShowInstruction] = useState(false);
    const [instruction, setInstruction] = useState("");
    /*
     * The prompt is fetched on open rather than carried with the list: it is rebuilt from the current
     * plan and theme, so it answers what the NEXT generation would send. Carrying it would show what
     * some earlier one did, which is the wrong question while looking at a render that came out wrong.
     */
    const [prompt, setPrompt] = useState<ComponentPromptDto | null>(null);
    const [promptOpen, setPromptOpen] = useState(false);
    const [promptLoading, setPromptLoading] = useState(false);

    const togglePrompt = async () => {
        if (promptOpen) {
            setPromptOpen(false);
            return;
        }
        setPromptOpen(true);
        if (prompt || promptLoading) {
            return;
        }
        setPromptLoading(true);
        try {
            setPrompt(await presenter.loadComponentPrompt(runId, component.signature));
        } finally {
            setPromptLoading(false);
        }
    };

    // An empty instruction generates the component again from its original prompt.
    const submitRegenerate = () => {
        const text = instruction.trim();
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

                    {/*
                     * The tiles follow their image rather than holding a fixed 4:3 shape. A section
                     * is whatever height it is — a navigation header is 84px against a 2642px feature
                     * block — and forcing both into one box turned the short ones into a thin strip
                     * floating in white, which reads as an empty preview rather than a small one.
                     * Capped so a tall component cannot push the card off the screen, and floored so a
                     * very short one still has somewhere to sit.
                     */}
                    <div className="grid grid-cols-2 items-start gap-sm">
                        <figure className="m-0 flex flex-col gap-xxs">
                            <div className="flex max-h-64 min-h-16 items-center justify-center overflow-hidden rounded-sm bg-neutral-subtle">
                                {sourceCropRef ? (
                                    <RunImage
                                        runId={runId}
                                        imageRef={sourceCropRef}
                                        alt="source section"
                                        className="h-auto w-full object-contain object-top"
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
                            <div className="flex max-h-64 min-h-16 items-center justify-center overflow-hidden rounded-sm border border-neutral-dimmed bg-neutral-base">
                                {render && render.ok && render.renderRef ? (
                                    <RunImage
                                        runId={runId}
                                        imageRef={render.renderRef}
                                        alt="generated component"
                                        className="h-auto w-full object-contain object-top"
                                    />
                                ) : (
                                    // "render failed" on its own was indistinguishable from "never
                                    // run", and said nothing about which of the two to go and fix.
                                    <div className="flex flex-col items-center gap-xxs p-sm text-center">
                                        <Text size="sm" className="text-neutral-strong">
                                            {render && !render.ok
                                                ? "render failed"
                                                : "not rendered"}
                                        </Text>
                                        {render?.error ? (
                                            <Text
                                                size="sm"
                                                className="break-words text-destructive-primary"
                                            >
                                                {render.error}
                                            </Text>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            <figcaption className="flex items-center justify-between gap-xs">
                                <Text size="sm" className="text-neutral-strong">
                                    Rendered
                                </Text>
                                {/*
                                 * Per component, because a whole-run pass costs roughly 45 seconds a
                                 * component and most of the time only one has changed.
                                 */}
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    text={
                                        renderingThis
                                            ? "Rendering…"
                                            : render
                                              ? "Re-render"
                                              : "Render"
                                    }
                                    disabled={renderingThis}
                                    title="Render just this component. The others keep their current screenshots."
                                    onClick={() =>
                                        void presenter.renderComponents(component.signature)
                                    }
                                />
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
                    <SizeBlock render={render} />
                </div>
                <ImageFinding render={render} />
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
                    <Button
                        variant="tertiary"
                        size="sm"
                        text={promptOpen ? "Hide prompt" : "View prompt"}
                        onClick={() => void togglePrompt()}
                    />
                    <Button
                        variant="tertiary"
                        size="sm"
                        text={logOpen ? "Hide log" : "Log"}
                        onClick={() => void presenter.toggleGenerationLog(component.signature)}
                    />
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
                {promptOpen ? (
                    <div className="flex flex-col gap-xs">
                        {promptLoading ? (
                            <Text className="text-neutral-strong">Building the prompt…</Text>
                        ) : prompt ? (
                            <>
                                {prompt.themeError ? (
                                    <Text className="text-destructive-primary">
                                        {`The theme could not be resolved (${prompt.themeError}), so this prompt names no theme variables — which is also what Generate would send.`}
                                    </Text>
                                ) : null}
                                <pre className="max-h-[32rem] overflow-auto rounded-sm bg-neutral-dimmed p-sm text-sm whitespace-pre-wrap">
                                    {prompt.prompt}
                                </pre>
                                <Text className="text-neutral-strong">
                                    {`${prompt.prompt.length.toLocaleString()} characters — built from the current plan and theme, so this is what the next generation would send.`}
                                </Text>
                            </>
                        ) : (
                            <Text className="text-neutral-strong">
                                No prompt: this component is not in the current plan. Re-run Plan to
                                see what Generate would send.
                            </Text>
                        )}
                    </div>
                ) : null}
                {logOpen ? (
                    <GenerationLog
                        state={logState}
                        prompts={logPrompts}
                        onOpenEntry={entryId =>
                            void presenter.loadGenerationPrompt(component.signature, entryId)
                        }
                    />
                ) : null}
                {showInstruction && !regenerating ? (
                    <div className="flex items-center gap-sm">
                        <Input
                            value={instruction}
                            onChange={(value: string) => setInstruction(value)}
                            placeholder="Instruction (optional) — e.g. make the heading larger. Leave empty to generate again from the original prompt"
                            onEnter={submitRegenerate}
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            text="Regenerate"
                            onClick={submitRegenerate}
                        />
                    </div>
                ) : null}
            </div>
            <ReviewControl
                key={component.contentSha256}
                contentSha256={component.contentSha256}
                review={review}
                verdicts={reviewVerdicts}
                reasons={reviewReasons}
                saving={reviewSaving}
                onSave={review => void presenter.setReview(component.signature, review)}
            />
        </div>
    );
};

/**
 * The Generate view (spec §6.7). One card per component, most-used first: the source section beside the
 * rendered component, the validators kept visually distinct as green/red assertion pills plus the
 * render's size against its section's, and an accept/reject decision that gates Promotion. The summary reports
 * the decision state (accepted / rejected / undecided). "View code" shows the generated source; renders
 * are triggered from here; regenerate-with-instruction is tracked separately.
 */
export const GenerateView = createReactiveComponent(function GenerateView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as GenerateArtifactDto | null;
    const runId = vm.run?.id ?? "";
    // Opening a component's code is a fetch: the Generate artifact references its components rather
    // than carrying their source, so the list is served without it.
    const [codeFor, setCodeFor] = useState<GeneratedComponentDetailDto | null>(null);
    const [codeLoading, setCodeLoading] = useState(false);

    const viewCode = async (signature: string) => {
        setCodeLoading(true);
        try {
            setCodeFor(await presenter.loadComponentDetail(runId, signature));
        } finally {
            setCodeLoading(false);
        }
    };

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
                            review={vm.reviews[component.signature]}
                            reviewVerdicts={vm.reviewVerdicts}
                            reviewReasons={vm.reviewReasons}
                            reviewSaving={vm.savingReviews.includes(component.signature)}
                            logOpen={vm.openLogs.includes(component.signature)}
                            logState={vm.generationLogs[component.signature]}
                            logPrompts={vm.generationPrompts}
                            regenerating={vm.regenerating.includes(component.signature)}
                            renderingThis={
                                vm.rendering || vm.renderingSignatures.includes(component.signature)
                            }
                            runId={runId}
                            onViewCode={() => viewCode(component.signature)}
                        />
                    ))}
                </div>
            </div>

            {codeLoading ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-xl">
                    <Text size="sm" className="text-neutral-light">
                        Loading source…
                    </Text>
                </div>
            ) : null}

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
