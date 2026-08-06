import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Input, Text } from "@webiny/admin-ui";
import {
    checkZoomConformance,
    getRamp,
    getTokenAtPath,
    META_EXTENSION,
    parseLength,
    rampStepPaths,
    toRem,
    validateFluidStep,
    type ThemeMode
} from "@webiny/theme-common";
import {
    ErrorMarker,
    ErrorNote,
    WarningMarker,
    WarningNote
} from "~/presentation/components/InlineWarning.js";
import { useThemes } from "~/presentation/useThemes.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";
import { InfoCard, MutedNote, Toggle } from "./_shared.js";

/** The fluid-capable, generated ramps that share this editor: the type sizes and the spacing scale. */
type RampKind = "text" | "space";

const P = ({ children }: { children: React.ReactNode }) => (
    <Text size="md" as="div" className="block text-neutral-primary leading-snug">
        {children}
    </Text>
);

const TEXT_SCALE_INFO = (
    <>
        <P>
            The ratio is the multiplier between one step and the next — a modular scale. Every step
            is generated from the base size and the ratio:
        </P>
        <Text size="sm" as="div" className="block font-mono text-neutral-strong">
            size = base × ratio ^ (distance from the base step)
        </Text>
        <P>
            The base step (md) is the anchor. Each step up multiplies by the ratio; each step down
            divides by it. With base 16px and ratio 1.2: sm ≈ 13px, md = 16px, lg ≈ 19px, xl ≈ 23px.
        </P>
        <P>
            A larger ratio (1.33–1.618) gives dramatic contrast between headings and body — good for
            editorial pages; a smaller ratio (1.1–1.2) keeps sizes close together — a tighter scale,
            good for apps. You set a ratio at each end; keep the phone ratio a little smaller than
            desktop so a dramatic scale does not make headings overflow on a phone.
        </P>
    </>
);

const TEXT_SCALING_INFO = (
    <>
        <P>
            Each step&apos;s toggle turns fluid sizing on or off.{" "}
            <span className="font-semibold">Off</span> — one fixed size everywhere (e.g. 16px).{" "}
            <span className="font-semibold">On</span> — the size scales with the viewport, growing
            from the phone size to the desktop size (shown as 18px → 20px), via a CSS clamp() with
            no breakpoints.
        </P>
        <P>
            Turn it on for large sizes — headings and hero text — so they shrink gracefully on
            phones instead of overflowing. Leave it off for body and small text, which should stay a
            consistent, readable size. By default it is on for the upper half of the ramp and off
            for md and below.
        </P>
        <P>
            An amber mark means a step scales too aggressively — a reader who zooms text may not get
            proportionally bigger text (an accessibility concern). Narrow its phone-to-desktop
            range, or turn scaling off.
        </P>
    </>
);

const SPACE_SCALE_INFO = (
    <>
        <P>
            The ratio is the multiplier between one spacing step and the next — a modular scale.
            Every step is generated from the base spacing and the ratio:
        </P>
        <Text size="sm" as="div" className="block font-mono text-neutral-strong">
            size = base × ratio ^ (distance from the base step)
        </Text>
        <P>
            The base step (md) is the anchor for padding, gaps and margins. Each step up multiplies
            by the ratio; each step down divides by it.
        </P>
        <P>
            A larger ratio spreads spacing out quickly — bold, airy layouts; a smaller ratio keeps
            steps close together — a tighter, denser rhythm. You set a ratio at each end so spacing
            can be a little tighter on phones than on desktop.
        </P>
    </>
);

const SPACE_SCALING_INFO = (
    <>
        <P>
            Each step&apos;s toggle turns fluid spacing on or off.{" "}
            <span className="font-semibold">Off</span> — one fixed value everywhere.{" "}
            <span className="font-semibold">On</span> — the spacing grows with the viewport, from
            the phone value to the desktop value (shown as 16px → 24px), via a CSS clamp() with no
            breakpoints.
        </P>
        <P>
            Turn it on for larger gaps and section padding so layouts breathe on desktop and tighten
            on phones. Leave it off for small, consistent spacing. By default it is on for the upper
            half of the ramp and off for the lower half.
        </P>
        <P>
            An amber mark means a step scales too aggressively for browser zoom to keep up — narrow
            its phone-to-desktop range, or turn scaling off.
        </P>
    </>
);

interface RampCopy {
    scaleTitle: string;
    scaleInfoTitle: string;
    scaleInfo: React.ReactNode;
    scaleNote: string;
    scalingInfo: React.ReactNode;
}

const RAMP_COPY: Record<RampKind, RampCopy> = {
    text: {
        scaleTitle: "Size ramp",
        scaleInfoTitle: "Base & ratio",
        scaleInfo: TEXT_SCALE_INFO,
        scaleNote: "Base size and ratio generate every step.",
        scalingInfo: TEXT_SCALING_INFO
    },
    space: {
        scaleTitle: "Spacing scale",
        scaleInfoTitle: "Base & ratio",
        scaleInfo: SPACE_SCALE_INFO,
        scaleNote: "Base spacing and ratio generate every step.",
        scalingInfo: SPACE_SCALING_INFO
    }
};

interface RampEditorProps {
    rampId: RampKind;
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

/** Renders a CSS length in px, the unit these ramps read best in. Falls back to the raw value. */
const toPx = (value: string): string => {
    const parsed = parseLength(value);
    return parsed ? `${Math.round(toRem(parsed) * 16)}px` : value;
};

/**
 * A small numeric field that keeps its own text while editing and commits on blur / Enter, so a
 * generator that regenerates the whole ramp does not fire on every keystroke (or fight a cleared
 * field). Re-syncs when the underlying value changes elsewhere.
 */
const NumberField = ({
    value,
    suffix,
    disabled,
    onCommit
}: {
    value: string;
    suffix?: string;
    disabled?: boolean;
    onCommit: (raw: string) => void;
}) => {
    const [text, setText] = useState(value);
    useEffect(() => setText(value), [value]);

    const commit = () => onCommit(text);

    return (
        <div className="flex items-center gap-xs">
            <div className="w-[60px]">
                <Input
                    value={text}
                    disabled={disabled}
                    onChange={setText}
                    onBlur={commit}
                    onKeyDown={event => {
                        if (event.key === "Enter") {
                            commit();
                        }
                    }}
                />
            </div>
            {suffix ? (
                <Text size="sm" className="text-neutral-dimmed">
                    {suffix}
                </Text>
            ) : null}
        </div>
    );
};

/** Base (px) and ratio for each viewport end. These generate every step. */
const GeneratorControls = observer(function GeneratorControls({
    rampId,
    note,
    theme,
    readOnly
}: {
    rampId: RampKind;
    note: string;
    theme: ThemeDto;
    readOnly: boolean;
}) {
    const themes = useThemes();
    const config = theme.settings.ramps[rampId];

    const update = (end: "min" | "max", key: "base" | "ratio", raw: string) => {
        const parsed = Number.parseFloat(raw);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return;
        }
        // Base is entered in px but stored in rem; ratio is unitless. Overrides are kept so per-step
        // scaling toggles survive a base/ratio change.
        const next = key === "base" ? parsed / 16 : parsed;
        themes.regenerateRamp(rampId, {
            ...config,
            [end]: { ...config[end], [key]: next }
        });
    };

    const row = (label: string, end: "min" | "max") => (
        <div className="flex items-center gap-md">
            <Text size="sm" className="w-16 flex-none text-neutral-strong">
                {label}
            </Text>
            <div className="flex items-center gap-xs">
                <Text size="sm" className="w-8 flex-none text-neutral-dimmed">
                    Base
                </Text>
                <NumberField
                    value={String(Math.round(config[end].base * 16))}
                    suffix="px"
                    disabled={readOnly}
                    onCommit={raw => update(end, "base", raw)}
                />
            </div>
            <div className="flex items-center gap-xs">
                <Text size="sm" className="w-10 flex-none text-neutral-dimmed">
                    Ratio
                </Text>
                <NumberField
                    value={String(config[end].ratio)}
                    disabled={readOnly}
                    onCommit={raw => update(end, "ratio", raw)}
                />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-sm">
            {row("Desktop", "max")}
            {row("Phone", "min")}
            <MutedNote>{note}</MutedNote>
        </div>
    );
});

/** One ramp step: its generated value (a range when it scales) and a toggle to make it scale. */
const RampStepRow = observer(function RampStepRow({
    rampId,
    theme,
    resolved,
    mode,
    readOnly,
    path,
    step
}: RampEditorProps & { path: string; step: string }) {
    const themes = useThemes();
    const config = theme.settings.ramps[rampId];

    const token = getTokenAtPath(theme.tokens, path);
    const fluid = token?.$extensions?.[META_EXTENSION]?.fluid;
    const enabled = Boolean(fluid?.enabled);
    const value = resolved.value(path, mode);
    const literal = typeof value === "string" ? value : (fluid?.min ?? "");
    // The publish gate validates fluid metadata whether or not the step is enabled, so an invalid
    // generated range (e.g. min > max at the small end) blocks a publish even on a disabled step.
    // Surface it here too, so the screen agrees with the publish dialog.
    const fluidError = fluid
        ? (validateFluidStep(fluid, theme.settings.viewport)[0]?.message ?? null)
        : null;
    const zoomWarning =
        !fluidError && enabled && fluid ? checkZoomConformance({ path, step: fluid }) : null;

    const display = enabled && fluid ? `${toPx(fluid.min)} → ${toPx(fluid.max)}` : toPx(literal);

    const toggle = (checked: boolean) => {
        themes.regenerateRamp(rampId, {
            ...config,
            overrides: {
                ...config.overrides,
                [step]: { ...config.overrides?.[step], enabled: checked }
            }
        });
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-sm py-sm">
                <Text size="sm" className="w-8 flex-none font-mono text-neutral-dimmed">
                    {step}
                </Text>
                <Text size="sm" className="flex-1 min-w-0 font-mono text-neutral-strong">
                    {display}
                </Text>
                {fluidError ? <ErrorMarker /> : zoomWarning ? <WarningMarker /> : null}
                <Toggle
                    checked={enabled}
                    disabled={readOnly}
                    label={`Scale ${step} between phone and desktop`}
                    onChange={toggle}
                />
            </div>
            {fluidError ? <ErrorNote message={fluidError} className="mb-xs" /> : null}
            {zoomWarning ? <WarningNote message={zoomWarning.message} className="mb-xs" /> : null}
        </div>
    );
});

/**
 * The editor for a fluid, generated ramp — the type sizes or the spacing scale. A generator (base +
 * ratio, per viewport end) over a clean list of steps. Step values are generated, not hand-set, so
 * the scale stays consistent; the only per-step control is whether it scales between phone and
 * desktop.
 */
export const RampEditor = observer(function RampEditor(props: RampEditorProps) {
    const { rampId } = props;
    const paths = rampStepPaths(rampId);
    const steps = getRamp(rampId).steps;
    const copy = RAMP_COPY[rampId];

    return (
        <>
            <InfoCard title={copy.scaleTitle} info={copy.scaleInfo} infoTitle={copy.scaleInfoTitle}>
                <GeneratorControls
                    rampId={rampId}
                    note={copy.scaleNote}
                    theme={props.theme}
                    readOnly={props.readOnly}
                />
            </InfoCard>

            <InfoCard title="Scaling" hint={`${steps.length} steps`} info={copy.scalingInfo}>
                <div className="flex flex-col divide-y divide-neutral-dimmed">
                    {paths.map((path, index) => (
                        <RampStepRow key={path} {...props} path={path} step={steps[index]} />
                    ))}
                </div>
            </InfoCard>
        </>
    );
});
