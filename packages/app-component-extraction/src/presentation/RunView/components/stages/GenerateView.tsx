import React, { useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Tag, Text, Textarea } from "@webiny/admin-ui";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import { ReactComponent as TuneIcon } from "@webiny/icons/tune.svg";
import { ReactComponent as CodeIcon } from "@webiny/icons/code.svg";
import { ReactComponent as ChatIcon } from "@webiny/icons/chat.svg";
import { ReactComponent as LogIcon } from "@webiny/icons/receipt_long.svg";
import { ReactComponent as RulerIcon } from "@webiny/icons/straighten.svg";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as AutorenewIcon } from "@webiny/icons/autorenew.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import { GenerationLog } from "./GenerationLog.js";
import {
    CHECKS,
    GENERATE_FILTERS,
    failureBanners,
    filterCounts,
    needsAttention,
    regenerateInstruction,
    visibleComponents,
    type GenerateFilter
} from "./generateList.js";
import type {
    GenerationLogState,
    GenerationPromptState,
    RunViewPresenter
} from "../../abstractions.js";
import type {
    ComponentDecisionDto,
    ComponentReviewDto,
    GenerateArtifactDto,
    GeneratedComponentDto,
    RenderRecordDto,
    ReviewOptionDto
} from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

/**
 * Joins classes without merging them. `cn` runs tailwind-merge, which reads the admin's colour classes
 * (`text-neutral-primary`) as font sizes and drops the size beside them, so a 12.5px chip came out 14px.
 */
const cx = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ");

/** How many cards show before "Show more": enough for a screen of review, not the whole run at once. */
const PAGE_SIZE = 8;

/** The small uppercase label above a tile or a group. */
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[11px] font-semibold uppercase leading-4 tracking-[.04em] text-neutral-muted">
        {children}
    </span>
);

/** A warning line inside a card: a failed check, or something the render observed. */
const WarningBanner = ({ title, detail }: { title: string; detail: string }) => (
    <div className="flex items-start gap-sm rounded-md bg-warning-subtle px-sm-extra py-sm-plus text-[13px] text-warning-800">
        <ErrorIcon className="mt-px size-[18px] flex-none fill-current" />
        <span className="min-w-0 break-words">
            <b className="font-semibold">{title}</b> {detail}
        </span>
    </div>
);

/**
 * What the render observed about the component's images. Not a check: it runs after Generate, in the
 * render, so it fails nothing — which is why it is worded as a finding rather than a failure. It exists
 * because a broken image is invisible to all three checks: measured across five sites, 8 of the 35
 * components that declare a file input emit a URL that cannot load, every one with three passed checks.
 */
const imageFinding = (
    render: RenderRecordDto | undefined
): { title: string; detail: string } | null => {
    const check = render?.imageCheck;
    const stringified = check?.stringifiedValues ?? [];
    const failed = check?.failedRequests ?? [];
    const unused = check?.declaredButUnused ?? [];
    if (stringified.length === 0 && failed.length === 0 && unused.length === 0) {
        return null;
    }
    const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
    const title =
        stringified.length > 0
            ? `${stringified.length} image ${plural(stringified.length, "value", "values")} stringified into a URL.`
            : failed.length > 0
              ? `${failed.length} ${plural(failed.length, "image", "images")} failed to load.`
              : `${unused.length} ${plural(unused.length, "image", "images")} shipped as a default and never shown.`;
    return {
        title: `Render finding: ${title}`,
        detail: [...stringified, ...failed, ...unused].slice(0, 2).join("; ")
    };
};

/**
 * The render's size against its section's, in words when they diverge. This replaced a visual
 * similarity score that tracked average brightness and nothing else (0.97 for a render 8.1x taller than
 * its section), so it states two measured heights rather than a verdict.
 */
const measurements = (component: GeneratedComponentDto, render: RenderRecordDto | undefined) => {
    const sourceHeight = render?.sourceHeight ?? null;
    const renderHeight = render?.ok ? render.height : null;
    const ratio = sourceHeight && renderHeight ? renderHeight / sourceHeight : null;
    const lines = [
        `section height   ${sourceHeight === null ? "—" : `${sourceHeight} px`}`,
        `render height    ${renderHeight === null ? "— (not rendered)" : `${renderHeight} px`}`
    ];
    if (ratio !== null && (ratio > 1.5 || ratio < 0.67)) {
        lines.push(
            ratio > 1
                ? `                 ${ratio.toFixed(1)}x taller than its section`
                : `                 ${(1 / ratio).toFixed(1)}x shorter than its section`
        );
    }
    if (render?.sourceWidth != null && render.width > 0 && render.sourceWidth !== render.width) {
        lines.push(`render width     ${render.width} px, against a ${render.sourceWidth} px crop`);
    }
    lines.push(`attempts         ${component.attempts}`);
    return lines.join("\n");
};

type DebugTab = "code" | "prompt" | "log" | "measurements";

const DEBUG_TABS: { value: DebugTab; label: string; icon: React.ReactElement; header: string }[] = [
    { value: "code", label: "View code", icon: <CodeIcon />, header: "Code" },
    { value: "prompt", label: "View prompt", icon: <ChatIcon />, header: "Prompt" },
    { value: "log", label: "Log", icon: <LogIcon />, header: "Log" },
    { value: "measurements", label: "Measurements", icon: <RulerIcon />, header: "Measurements" }
];

/** A source or render tile: the image at its own shape, capped so a tall section cannot take over. */
const Tile = ({
    rendered,
    children,
    className
}: {
    rendered: boolean;
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={cx(
            "flex max-h-[220px] min-h-[110px] items-center justify-center overflow-hidden rounded-md",
            rendered
                ? "border border-solid border-neutral-dimmed"
                : "border border-dashed border-neutral-dimmed-darker",
            className
        )}
    >
        {children}
    </div>
);

interface CardProps {
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
}

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
    runId
}: CardProps) => {
    const attention = needsAttention(component);
    const failures = failureBanners(component);
    const finding = imageFinding(render);
    const rendered = Boolean(render?.ok && render.renderRef);

    // A review judges the output on screen: one given on an earlier revision does not count for this one.
    const standing =
        review && review.contentSha256 === component.contentSha256 ? review : undefined;

    const [adjustOpen, setAdjustOpen] = useState(false);
    const [issues, setIssues] = useState<string[]>([]);
    const [note, setNote] = useState("");
    const [tab, setTab] = useState<DebugTab | null>(null);
    // Code and prompt are fetched when their tab opens: the list is served without source, and the
    // prompt is rebuilt from the current plan and theme, so it answers what the NEXT generation sends.
    const [body, setBody] = useState<{ tab: DebugTab; text: string } | null>(null);
    const [bodyLoading, setBodyLoading] = useState(false);

    const openAdjust = () => {
        if (!adjustOpen) {
            setIssues(standing?.reasons ?? []);
            setNote(standing?.note ?? "");
        }
        setAdjustOpen(open => !open);
    };

    const selectTab = async (next: DebugTab) => {
        const closing = tab === next;
        // The log is the presenter's: it loads and polls while open, so it is open exactly while its
        // tab is the one selected.
        const wantLog = !closing && next === "log";
        if (wantLog !== logOpen) {
            void presenter.toggleGenerationLog(component.signature);
        }
        setTab(closing ? null : next);
        if (closing || (next !== "code" && next !== "prompt") || body?.tab === next) {
            return;
        }
        setBodyLoading(true);
        try {
            if (next === "code") {
                const detail = await presenter.loadComponentDetail(runId, component.signature);
                setBody({
                    tab: next,
                    text: !detail
                        ? "The source could not be read."
                        : detail.css
                          ? `${detail.source}\n\n/* CSS */\n${detail.css}`
                          : detail.source
                });
            } else {
                const prompt = await presenter.loadComponentPrompt(runId, component.signature);
                setBody({
                    tab: next,
                    text: prompt
                        ? `${prompt.themeError ? `The theme could not be resolved (${prompt.themeError}), so this prompt names no theme variables, which is also what Generate would send.\n\n` : ""}${prompt.prompt}`
                        : "No prompt: this component is not in the current plan. Re-run Plan to see what Generate would send."
                });
            }
        } finally {
            setBodyLoading(false);
        }
    };

    const closeTab = () => {
        if (tab === "log" && logOpen) {
            void presenter.toggleGenerationLog(component.signature);
        }
        setTab(null);
    };

    const issueLabels = reviewReasons
        .filter(reason => issues.includes(reason.value))
        .map(reason => reason.label);

    // The issues picked and the note are kept as review data on this output, whichever button sends them.
    const saveReview = () =>
        presenter.setReview(component.signature, {
            verdict: "needs-polish",
            reasons: issues,
            note
        });

    const regenerate = async () => {
        if (issues.length > 0 || note.trim()) {
            await saveReview();
        }
        // An empty instruction generates the component again from its original prompt.
        void presenter.regenerateComponent(
            component.signature,
            regenerateInstruction(issueLabels, note)
        );
        setAdjustOpen(false);
    };

    const pickVerdict = (verdict: string) =>
        void presenter.setReview(component.signature, {
            verdict,
            reasons: standing?.reasons ?? [],
            note: standing?.note ?? ""
        });

    const setDecision = (target: ComponentDecisionDto | "none") =>
        void presenter.setDecision(component.signature, target);

    const meta = [
        `${component.pageCount} ${component.pageCount === 1 ? "page" : "pages"}`,
        component.type,
        component.attempts <= 1 ? "first attempt" : `${component.attempts} attempts`
    ].join(" · ");

    const debugText =
        tab === "measurements"
            ? measurements(component, render)
            : tab && body?.tab === tab
              ? body.text
              : "";

    return (
        <div
            className={cx(
                "overflow-hidden rounded-lg border bg-neutral-base shadow-sm",
                attention
                    ? "border-warning-300"
                    : decision === "accepted"
                      ? "border-success-400"
                      : "border-neutral-dimmed"
            )}
        >
            <div className="flex flex-wrap items-center gap-x-md gap-y-sm-extra px-md py-sm-extra">
                <div className="min-w-0 flex-[1_1_220px]">
                    <div className="truncate text-md font-semibold text-neutral-primary">
                        {component.name}
                    </div>
                    <div className="mt-xxs truncate text-sm text-neutral-muted">{meta}</div>
                </div>

                <div className="flex min-w-0 flex-[0_1_auto] flex-wrap items-center gap-x-md gap-y-sm-extra">
                    <div className="flex w-[170px] flex-none flex-col gap-[3px]">
                        {CHECKS.map(check => {
                            const passed = component.validation[check.key].passed;
                            return (
                                <div
                                    key={check.key}
                                    className={cx(
                                        "flex items-center gap-xs-plus text-sm",
                                        passed
                                            ? "text-neutral-strong"
                                            : "font-semibold text-warning-800"
                                    )}
                                >
                                    {passed ? (
                                        <CheckIcon className="size-[15px] flex-none fill-success-600" />
                                    ) : (
                                        <ErrorIcon className="size-[15px] flex-none fill-warning-600" />
                                    )}
                                    {passed ? check.passed : check.failed}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-none items-center justify-end gap-xs-plus">
                        {decision === "accepted" ? (
                            <>
                                <Tag variant="success-light" content="Accepted" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    text="Undo"
                                    onClick={() => setDecision("none")}
                                />
                            </>
                        ) : decision === "rejected" ? (
                            <>
                                <Tag variant="destructive" content="Rejected" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    text="Undo"
                                    onClick={() => setDecision("none")}
                                />
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    icon={<CheckIcon />}
                                    text="Accept"
                                    onClick={() => setDecision("accepted")}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    text="Reject"
                                    onClick={() => setDecision("rejected")}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-sm-extra px-md pb-[14px]">
                {failures.map(failure => (
                    <WarningBanner
                        key={failure.title}
                        title={failure.title}
                        detail={failure.detail}
                    />
                ))}
                {finding ? <WarningBanner title={finding.title} detail={finding.detail} /> : null}

                <div className="grid grid-cols-2 gap-[14px]">
                    <div className="flex min-w-0 flex-col gap-xs-plus">
                        <div className="flex h-md items-center">
                            <Eyebrow>Source</Eyebrow>
                        </div>
                        <Tile rendered={true} className="bg-neutral-subtle">
                            {sourceCropRef ? (
                                <RunImage
                                    runId={runId}
                                    imageRef={sourceCropRef}
                                    alt="source section"
                                    className="h-auto w-full object-contain object-top"
                                />
                            ) : (
                                <span className="text-[13px] text-neutral-muted">
                                    No source crop
                                </span>
                            )}
                        </Tile>
                    </div>
                    <div className="flex min-w-0 flex-col gap-xs-plus">
                        <div className="flex h-md items-center justify-between">
                            <Eyebrow>Rendered component</Eyebrow>
                            {/*
                             * Per component, because a whole-run pass costs roughly 45 seconds a
                             * component and most of the time only one has changed.
                             */}
                            {rendered ? (
                                <button
                                    type="button"
                                    className="cursor-pointer text-sm text-accent-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-disabled"
                                    disabled={renderingThis}
                                    onClick={() =>
                                        void presenter.renderComponents(component.signature)
                                    }
                                >
                                    {renderingThis ? "Rendering…" : "Render again"}
                                </button>
                            ) : null}
                        </div>
                        <Tile rendered={rendered} className="bg-neutral-base">
                            {rendered && render ? (
                                <RunImage
                                    runId={runId}
                                    imageRef={render.renderRef}
                                    alt="generated component"
                                    className="h-auto w-full object-contain object-top"
                                />
                            ) : (
                                // "Render failed" is not "never rendered": say which, so the right one gets fixed.
                                <div className="flex flex-col items-center gap-sm p-sm text-center">
                                    <span className="text-[13px] text-neutral-muted">
                                        {render && !render.ok
                                            ? "Render failed"
                                            : "Not rendered yet"}
                                    </span>
                                    {render?.error ? (
                                        <span className="break-words text-sm text-destructive-primary">
                                            {render.error}
                                        </span>
                                    ) : null}
                                    <Button
                                        variant="tertiary"
                                        size="sm"
                                        icon={<VisibilityIcon />}
                                        text={
                                            renderingThis
                                                ? "Rendering…"
                                                : render
                                                  ? "Render again"
                                                  : "Render preview"
                                        }
                                        disabled={renderingThis}
                                        onClick={() =>
                                            void presenter.renderComponents(component.signature)
                                        }
                                    />
                                </div>
                            )}
                        </Tile>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-sm-extra">
                    <div className="flex items-center gap-sm">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<TuneIcon />}
                            text={regenerating ? "Regenerating…" : "Adjust and regenerate"}
                            disabled={regenerating}
                            onClick={openAdjust}
                        />
                        {decision === "accepted" && reviewVerdicts.length > 0 ? (
                            // The review verdict: how much of this component a person still has to do.
                            <div
                                className="ml-xs-plus flex gap-xxs rounded-md bg-neutral-dimmed p-xxs"
                                title={
                                    review
                                        ? standing
                                            ? `Reviewed by ${review.reviewer?.displayName ?? "someone"}, ${new Date(review.reviewedOn).toLocaleString()}.`
                                            : `Reviewed on an earlier output (revision ${review.revision}). This output has not been reviewed.`
                                        : undefined
                                }
                            >
                                {reviewVerdicts.map(verdict => {
                                    const picked = standing?.verdict === verdict.value;
                                    return (
                                        <button
                                            key={verdict.value}
                                            type="button"
                                            disabled={reviewSaving}
                                            onClick={() => pickVerdict(verdict.value)}
                                            className={cx(
                                                "cursor-pointer whitespace-nowrap rounded-[5px] px-sm-plus py-xs text-[12.5px] leading-4",
                                                picked
                                                    ? "bg-neutral-base font-semibold text-neutral-primary shadow-sm"
                                                    : "bg-transparent text-neutral-strong"
                                            )}
                                        >
                                            {verdict.label}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-xs">
                        {DEBUG_TABS.map(item => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => void selectTab(item.value)}
                                className={cx(
                                    "flex cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-md border border-solid px-sm-plus py-xs text-[12.5px] leading-4",
                                    tab === item.value
                                        ? "border-neutral-muted bg-neutral-light text-neutral-primary"
                                        : "border-neutral-dimmed bg-neutral-base text-neutral-strong"
                                )}
                            >
                                {React.cloneElement(item.icon, {
                                    className: "size-[15px] flex-none fill-current"
                                })}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {adjustOpen ? (
                    <div className="flex flex-col gap-sm-extra rounded-lg border border-solid border-neutral-dimmed bg-neutral-subtle px-md py-[14px]">
                        <div>
                            <div className="text-[13px] font-semibold text-neutral-primary">
                                What&apos;s off?
                            </div>
                            <div className="mt-xxs text-sm text-neutral-muted">
                                Pick what applies. It&apos;s sent to the model with your note, and
                                kept as review data.
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-xs-plus">
                            {reviewReasons.map(reason => {
                                const on = issues.includes(reason.value);
                                return (
                                    <button
                                        key={reason.value}
                                        type="button"
                                        onClick={() =>
                                            setIssues(list =>
                                                on
                                                    ? list.filter(value => value !== reason.value)
                                                    : [...list, reason.value]
                                            )
                                        }
                                        className={cx(
                                            "flex cursor-pointer items-center gap-[5px] rounded-md border border-solid px-sm-plus py-[5px] text-[12.5px] leading-4",
                                            on
                                                ? "border-accent-default bg-primary-subtle text-primary-800"
                                                : "border-neutral-muted bg-neutral-base text-neutral-strong"
                                        )}
                                    >
                                        {on ? (
                                            <CheckIcon className="size-[15px] fill-current" />
                                        ) : null}
                                        {reason.label}
                                    </button>
                                );
                            })}
                        </div>
                        <Textarea
                            value={note}
                            onChange={(value: string) => setNote(value)}
                            placeholder="Describe the change, e.g. the cards should sit in three columns and keep the dark background"
                            rows={2}
                        />
                        <div className="flex items-center gap-sm">
                            <Button
                                variant="primary"
                                size="sm"
                                icon={<AutorenewIcon />}
                                text="Regenerate"
                                disabled={regenerating || reviewSaving}
                                onClick={() => void regenerate()}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                text={reviewSaving ? "Saving…" : "Save as review only"}
                                disabled={reviewSaving}
                                onClick={async () => {
                                    await saveReview();
                                    setAdjustOpen(false);
                                }}
                            />
                            <span className="ml-auto text-sm text-neutral-muted">
                                {issues.length > 0
                                    ? `${issues.length} selected · one model call`
                                    : "One model call"}
                            </span>
                        </div>
                    </div>
                ) : null}

                {tab ? (
                    <div className="overflow-hidden rounded-lg border border-solid border-neutral-dimmed">
                        <div className="flex items-center justify-between border-b border-solid border-neutral-dimmed bg-neutral-subtle px-sm-extra py-sm">
                            <span className="font-mono text-sm text-neutral-strong">
                                {`${DEBUG_TABS.find(item => item.value === tab)!.header} · ${component.name}`}
                            </span>
                            <span className="flex gap-sm-plus">
                                {tab !== "log" && debugText ? (
                                    <button
                                        type="button"
                                        aria-label="Copy"
                                        className="flex cursor-pointer"
                                        onClick={() =>
                                            void navigator.clipboard.writeText(debugText)
                                        }
                                    >
                                        <CopyIcon className="size-md fill-neutral-600" />
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    aria-label="Close"
                                    className="flex cursor-pointer"
                                    onClick={closeTab}
                                >
                                    <CloseIcon className="size-md fill-neutral-600" />
                                </button>
                            </span>
                        </div>
                        {tab === "log" ? (
                            <div className="max-h-[320px] overflow-auto px-[14px] py-sm-extra">
                                <GenerationLog
                                    state={logState}
                                    prompts={logPrompts}
                                    onOpenEntry={entryId =>
                                        void presenter.loadGenerationPrompt(
                                            component.signature,
                                            entryId
                                        )
                                    }
                                />
                            </div>
                        ) : (
                            <pre className="m-0 max-h-[220px] overflow-auto whitespace-pre-wrap break-words px-[14px] py-sm-extra font-mono text-sm leading-[18px] text-neutral-primary">
                                {bodyLoading && !debugText ? "Loading…" : debugText}
                            </pre>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

/**
 * The Generate view: every generated component as a card, those needing attention first, then the
 * most-used. Each card sets the source beside the render, lists its three checks, says what a failed
 * one found, and takes the accept/reject decision that gates Promote. A review verdict, the issues
 * found and a note go with "Adjust and regenerate"; code, prompt, log and measurements open inline.
 */
export const GenerateView = createReactiveComponent(function GenerateView({ presenter }: Props) {
    const { vm } = presenter;
    // Only this stage's artifact: on a tab switch the previous stage's is still loaded for a render,
    // and another stage's shape here crashes the view (Plan's components carry no validation).
    const artifact =
        vm.artifactStage === "generate" ? (vm.artifact as GenerateArtifactDto | null) : null;
    const runId = vm.run?.id ?? "";
    const [filter, setFilter] = useState<GenerateFilter>("all");
    const [shown, setShown] = useState(PAGE_SIZE);

    const rendersBySignature = useMemo(() => {
        const map = new Map<string, RenderRecordDto>();
        for (const record of vm.renders ?? []) {
            map.set(record.signature, record);
        }
        return map;
    }, [vm.renders]);

    const components = artifact?.components ?? [];
    const decisions = vm.decisions as Record<string, string>;
    const counts = useMemo(() => filterCounts(components, decisions), [components, decisions]);
    const visible = useMemo(
        () => visibleComponents(components, decisions, filter),
        [components, decisions, filter]
    );

    if (vm.artifactLoading && !artifact?.components) {
        return (
            <Text className="px-lg py-md text-neutral-strong">Loading generated components…</Text>
        );
    }
    if (!components.length) {
        return (
            <Text className="px-lg py-md text-neutral-strong">
                Run Generate to produce components.
            </Text>
        );
    }

    // "Accept all passing" accepts only the components that passed every check.
    const passing = components.filter(component => !needsAttention(component));
    const passingAccepted =
        passing.length > 0 && passing.every(c => vm.decisions[c.signature] === "accepted");

    return (
        <div className="h-full overflow-y-auto">
            <div className="flex flex-col gap-[14px] px-lg pb-xxl pt-[14px]">
                <div className="flex flex-wrap items-center justify-between gap-md border-b border-solid border-neutral-dimmed">
                    <div className="flex flex-wrap gap-xxs" role="tablist">
                        {GENERATE_FILTERS.map(item => {
                            const selected = filter === item.value;
                            const warn = item.value === "attention" && counts.attention > 0;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    onClick={() => {
                                        setFilter(item.value);
                                        setShown(PAGE_SIZE);
                                    }}
                                    className={cx(
                                        "-mb-px flex cursor-pointer items-center gap-xs-plus whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-sm-extra py-sm text-[13.5px] leading-4",
                                        selected
                                            ? "border-accent-default font-semibold text-neutral-primary"
                                            : "border-transparent text-neutral-strong"
                                    )}
                                >
                                    {warn ? (
                                        <ErrorIcon className="size-md flex-none fill-warning-600" />
                                    ) : null}
                                    {item.label}
                                    <span
                                        className={cx(
                                            "rounded-sm px-[5px] text-sm font-normal",
                                            warn
                                                ? "bg-warning-subtle text-warning-800"
                                                : "bg-neutral-light text-neutral-muted"
                                        )}
                                    >
                                        {counts[item.value]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-sm pb-xs-plus">
                        <Button
                            variant="tertiary"
                            size="sm"
                            text={
                                passingAccepted
                                    ? "Passing accepted"
                                    : `Accept all passing (${passing.length})`
                            }
                            disabled={passing.length === 0 || passingAccepted}
                            title="Accept only the components that passed every check"
                            onClick={() =>
                                void presenter.acceptAll(
                                    passing.map(component => component.signature)
                                )
                            }
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            text={vm.rendering ? "Rendering…" : "Render all previews"}
                            disabled={vm.rendering}
                            onClick={() => void presenter.renderComponents()}
                        />
                    </div>
                </div>

                <div className="text-[12.5px] text-neutral-muted">
                    Components that need attention come first, then by page count.
                </div>

                <div className="flex flex-col gap-sm-plus">
                    {visible.slice(0, shown).map(component => (
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
                        />
                    ))}
                    {visible.length === 0 ? (
                        <Text size="sm" className="py-md text-center text-neutral-muted">
                            No components here.
                        </Text>
                    ) : null}
                </div>

                {visible.length > shown ? (
                    <Button
                        variant="ghost"
                        className="self-center"
                        text={`Show ${visible.length - shown} more component${visible.length - shown === 1 ? "" : "s"}`}
                        onClick={() => setShown(visible.length)}
                    />
                ) : null}
            </div>
        </div>
    );
});
