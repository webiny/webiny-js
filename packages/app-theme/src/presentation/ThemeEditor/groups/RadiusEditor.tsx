import React from "react";
import { observer } from "mobx-react-lite";
import { Text } from "@webiny/admin-ui";
import { getRamp, rampStepPaths, type ThemeMode } from "@webiny/theme-common";
import { useThemes } from "~/presentation/useThemes.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";
import { EditableLength, InfoCard } from "./_shared.js";

const P = ({ children }: { children: React.ReactNode }) => (
    <Text size="md" as="div" className="block text-neutral-primary leading-snug">
        {children}
    </Text>
);

/** Explains corner radius — on the "Corner radius" box. */
const RADIUS_INFO = (
    <>
        <P>
            Corner radius rounds the corners of surfaces — cards, buttons, inputs, menus. The named
            steps run from smallest to largest, and every component picks a step, so rounding stays
            consistent across the site.
        </P>
        <P>
            Edit a value in any CSS length: px or rem for a fixed radius (e.g. 8px), 0 for square
            corners, or a very large value (9999px) for fully pill-shaped or circular elements. The
            preview shows the corners at each step.
        </P>
        <P>
            Unlike spacing and type, radii are hand-set — there is no ratio. The set of steps is
            fixed, though, so a token like radius.md means the same thing everywhere.
        </P>
    </>
);

interface RadiusEditorProps {
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

/** One radius step: a live-rounded preview and its editable length. */
const RadiusStepRow = observer(function RadiusStepRow({
    resolved,
    mode,
    readOnly,
    path,
    step
}: RadiusEditorProps & { path: string; step: string }) {
    const themes = useThemes();
    const value = resolved.value(path, mode);
    const literal = typeof value === "string" ? value : "";

    return (
        <div className="flex items-center gap-sm py-sm">
            <Text size="sm" className="w-8 flex-none font-mono text-neutral-dimmed">
                {step}
            </Text>
            <div className="flex-1 min-w-0">
                <div
                    className="size-10 border-2 border-neutral-strong bg-neutral-light"
                    style={{ borderRadius: literal || undefined }}
                />
            </div>
            <div className="w-[110px] flex-none">
                <EditableLength
                    value={literal}
                    disabled={readOnly}
                    onChange={next => themes.setTokenValue(path, mode, next)}
                />
            </div>
        </div>
    );
});

/**
 * Corner radius — a fixed set of named steps with hand-set values. No ratio or fluid scaling (radii
 * don't grow with the viewport), so it is a single box: a live preview of each corner next to its
 * editable length.
 */
export const RadiusEditor = observer(function RadiusEditor(props: RadiusEditorProps) {
    const paths = rampStepPaths("radius");
    const steps = getRamp("radius").steps;

    return (
        <InfoCard title="Corner radius" hint={`${steps.length} steps`} info={RADIUS_INFO}>
            <div className="flex flex-col divide-y divide-neutral-dimmed">
                {paths.map((path, index) => (
                    <RadiusStepRow key={path} {...props} path={path} step={steps[index]} />
                ))}
            </div>
        </InfoCard>
    );
});
