import React from "react";
import { Icon, Tag, Text, cn } from "@webiny/admin-ui";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as AutorenewIcon } from "@webiny/icons/autorenew.svg";
import { ReactComponent as PauseIcon } from "@webiny/icons/pause.svg";
import { ReactComponent as ErrorIcon } from "@webiny/icons/priority_high.svg";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { STATUS_CONFIG, type DisplayStatus, type StatusGlyph } from "./status.js";
import { stageKindSentence, type StageKind } from "./stages.js";

/**
 * The shared status vocabulary + stage-kind treatment (W9.1, spec §1). Built entirely from `@webiny/admin-ui`
 * primitives and design-system tokens: the status dot is composed (admin-ui's `Tag` has no dot slot), the
 * status tag is `Tag`, the AI chip is `Tag` in the accent-light family. Every W9 screen consumes these so
 * the six statuses and the two stage kinds render identically across the list, the rail, headers and history.
 */

const GLYPHS: Record<Exclude<StatusGlyph, "number">, React.ReactElement> = {
    check: <CheckIcon />,
    autorenew: <AutorenewIcon />,
    pause: <PauseIcon />,
    error: <ErrorIcon />,
    history: <HistoryIcon />
};

interface StatusDotProps {
    status: DisplayStatus;
    /** Shown inside the dot for the "not started" state (the stage number, per spec §1). */
    stageNumber?: number;
    className?: string;
}

/** A 20px status dot: a filled/outlined circle carrying a glyph, or the stage number when not started. */
export const StatusDot = ({ status, stageNumber, className }: StatusDotProps) => {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                config.dot,
                config.glyphColor,
                config.pulse && "animate-pulse",
                className
            )}
            role="img"
            aria-label={config.label}
        >
            {config.glyph === "number" ? (
                <span className="text-xs font-semibold leading-none">{stageNumber ?? ""}</span>
            ) : (
                <Icon icon={GLYPHS[config.glyph]} label={config.label} size="xs" />
            )}
        </span>
    );
};

/** The status as an admin-ui Tag in its design tag family (published / review / draft → success/accent/neutral). */
export const StatusTag = ({ status, className }: { status: DisplayStatus; className?: string }) => {
    const config = STATUS_CONFIG[status];
    return <Tag variant={config.tagVariant} content={config.label} className={className} />;
};

/** Dot + tag together — the common status treatment for rail rows, stage headers and run history. */
export const StageStatus = ({
    status,
    stageNumber,
    className
}: {
    status: DisplayStatus;
    stageNumber?: number;
    className?: string;
}) => (
    <span className={cn("inline-flex items-center gap-sm", className)}>
        <StatusDot status={status} stageNumber={stageNumber} />
        <StatusTag status={status} />
    </span>
);

/** The "AI" chip carried by the three model-backed stages; nothing for deterministic stages (spec §1). */
export const StageKindChip = ({ kind }: { kind: StageKind }) => {
    if (kind !== "model") {
        return null;
    }
    return <Tag variant="accent-light" content="AI" />;
};

/** The full stage-kind sentence for a stage header. */
export const StageKindSentence = ({ kind, className }: { kind: StageKind; className?: string }) => (
    <Text size="sm" className={cn("text-neutral-strong", className)}>
        {stageKindSentence(kind)}
    </Text>
);

/** The two-line legend for the stage rail footer (spec §1). */
export const PipelineLegend = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-col gap-xxs", className)}>
        <div className="flex items-center gap-xs">
            <Tag variant="accent-light" content="AI" />
            <Text size="sm" className="text-neutral-strong">
                Model-backed — output can vary between runs.
            </Text>
        </div>
        <Text size="sm" className="text-neutral-strong">
            Every other stage is deterministic — identical input, identical output.
        </Text>
    </div>
);
