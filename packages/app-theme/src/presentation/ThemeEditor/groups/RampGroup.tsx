import React from "react";
import { observer } from "mobx-react-lite";
import { Input, Switch, Text } from "@webiny/admin-ui";
import {
    formatShadow,
    getRamp,
    getTokenAtPath,
    isShadowValue,
    META_EXTENSION,
    parseLength,
    rampStepPaths,
    toRem,
    type RampId,
    type ThemeMode
} from "@webiny/theme-common";
import { Swatch } from "~/presentation/components/Swatch.js";
import { WarningMarker, WarningNote } from "~/presentation/components/InlineWarning.js";
import { checkZoomConformance } from "@webiny/theme-common";
import { useThemes } from "~/presentation/useThemes.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";

/**
 * A starting maximum when a fixed step is switched to scaling. 1.25× keeps the step comfortably
 * inside the 2.5× zoom-conformance rule of thumb, so turning scaling on never immediately produces
 * a warning.
 */
const defaultMaxFor = (min: string): string => {
    const parsed = parseLength(min);
    if (!parsed) {
        return min;
    }
    return `${Math.round(toRem(parsed) * 1.25 * 10000) / 10000}rem`;
};

interface RampGroupProps {
    rampId: RampId;
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

/**
 * Spacing, radius and shadow share one editor: a fixed list of steps, each with a value and — for
 * the fluid-capable ramps — a min/max pair and a scaling toggle.
 *
 * A relative-width bar makes the ramp read as a ramp. Reading nine rem values and mentally sorting
 * them is exactly the work the design brief says the editor should be doing for you.
 */
export const RampGroup = observer(function RampGroup({
    rampId,
    theme,
    resolved,
    mode,
    readOnly
}: RampGroupProps) {
    const themes = useThemes();
    const ramp = getRamp(rampId);
    const paths = rampStepPaths(rampId);

    const remValues = paths.map(path => {
        const value = resolved.value(path, mode);
        const parsed = typeof value === "string" ? parseLength(value) : null;
        return parsed ? toRem(parsed) : 0;
    });
    const largest = Math.max(...remValues, 1);

    return (
        <div className="flex-1 min-h-0 overflow-y-auto px-md py-sm flex flex-col gap-xs">
            {paths.map((path, index) => {
                const step = ramp.steps[index];
                const value = resolved.value(path, mode);
                const token = getTokenAtPath(theme.tokens, path);
                const fluid = token?.$extensions?.[META_EXTENSION]?.fluid;

                const zoomWarning = fluid ? checkZoomConformance({ path, step: fluid }) : null;

                return (
                    <div key={path} className="flex flex-col">
                        <div className="flex items-center gap-sm py-xs">
                            <Text
                                size="sm"
                                className="w-10 flex-none font-mono text-neutral-strong"
                            >
                                {step}
                            </Text>

                            {rampId === "shadow" ? (
                                <div
                                    className="size-8 flex-none rounded-sm bg-neutral-base"
                                    style={{
                                        boxShadow: isShadowValue(value)
                                            ? formatShadow(value)
                                            : undefined
                                    }}
                                />
                            ) : rampId === "radius" ? (
                                <div
                                    className="size-8 flex-none border-2 border-accent-default bg-neutral-light"
                                    style={{
                                        borderRadius: typeof value === "string" ? value : undefined
                                    }}
                                />
                            ) : (
                                <div className="flex-1 min-w-0 h-2 bg-neutral-light rounded-sm overflow-hidden">
                                    <div
                                        className="h-full bg-accent-default"
                                        style={{
                                            width: `${Math.round((remValues[index] / largest) * 100)}%`
                                        }}
                                    />
                                </div>
                            )}

                            {ramp.fluidCapable && fluid?.enabled ? (
                                <Text
                                    size="sm"
                                    className="flex-none font-mono text-neutral-strong"
                                >{`${fluid.min} → ${fluid.max}`}</Text>
                            ) : (
                                <Text size="sm" className="flex-none font-mono text-neutral-strong">
                                    {typeof value === "string" ? value : "—"}
                                </Text>
                            )}

                            {zoomWarning ? <WarningMarker /> : null}

                            {ramp.fluidCapable ? (
                                <Switch
                                    checked={fluid?.enabled ?? false}
                                    disabled={readOnly || !fluid}
                                    label="Scales"
                                    onChange={(checked: boolean) => {
                                        if (!fluid) {
                                            return;
                                        }
                                        // Re-enabling restores a maximum: a step whose max was
                                        // collapsed onto its min would otherwise stay fixed while
                                        // claiming to scale.
                                        const max =
                                            checked && fluid.max === fluid.min
                                                ? defaultMaxFor(fluid.min)
                                                : fluid.max;

                                        themes.setFluid(path, { ...fluid, max, enabled: checked });
                                    }}
                                />
                            ) : null}
                        </div>

                        {zoomWarning ? (
                            <WarningNote message={zoomWarning.message} indented={false} />
                        ) : null}
                    </div>
                );
            })}

            {rampId === "shadow" ? (
                <Text size="sm" className="block text-neutral-strong pt-sm">
                    Shadows are edited as full CSS shadow values. Colour and offsets can reference
                    other tokens.
                </Text>
            ) : null}
        </div>
    );
});

/** Placeholder swatch used while a ramp value cannot be resolved. */
export const UnresolvedSwatch = () => <Swatch color={undefined} />;

/** A plain text input for a single length, used by the radius editor. */
export const LengthInput = ({
    value,
    disabled,
    onChange
}: {
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
}) => <Input value={value} disabled={disabled} onChange={onChange} />;
