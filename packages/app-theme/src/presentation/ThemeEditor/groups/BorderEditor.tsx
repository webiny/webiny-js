import React from "react";
import { observer } from "mobx-react-lite";
import { Text } from "@webiny/admin-ui";
import { getRamp, rampStepPaths, type ThemeMode } from "@webiny/theme-common";
import { useThemes } from "~/presentation/useThemes.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";
import { Collapsible, EditableLength } from "./_shared.js";
import { SemanticSlotList } from "./SemanticSlotList.js";

/** A line at a real width — the only honest preview of a border width, which a number can't convey. */
const BorderLine = ({ width }: { width: string }) => (
    <div
        className="w-10 border-neutral-strong"
        style={{ borderTopStyle: "solid", borderTopWidth: width || "0px" }}
    />
);

const P = ({ children }: { children: React.ReactNode }) => (
    <Text size="md" as="div" className="block text-neutral-primary leading-snug">
        {children}
    </Text>
);

const BORDERS_INFO = (
    <>
        <P>
            Border widths are their own scale, separate from border colours (which live on the
            Colors screen). Components bind to the named roles — a control border, the focus ring,
            its offset — never to a raw step, so widths stay consistent.
        </P>
        <P>
            The focus ring and its offset are called out because a colour alone can’t size a ring; a
            generated interactive component needs both. The preview shows a line at each real width.
        </P>
    </>
);

interface BorderEditorProps {
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

const BorderStepRow = observer(function BorderStepRow({
    resolved,
    mode,
    readOnly,
    path,
    step
}: BorderEditorProps & { path: string; step: string }) {
    const themes = useThemes();
    const value = resolved.value(path, mode);
    const literal = typeof value === "string" ? value : "";

    return (
        <div className="flex items-center gap-sm py-sm">
            <Text size="sm" className="w-16 flex-none font-mono text-neutral-dimmed">
                {step}
            </Text>
            <div className="flex-1 min-w-0">
                <BorderLine width={literal} />
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
 * Borders — the semantic roles above (control, focus ring, focus offset, each pointing at a width
 * step), and the three-step width scale below. Mirrors the two-layer treatment on radius, shadow and
 * spacing, and the brand-palette/semantic split on colour.
 */
export const BorderEditor = observer(function BorderEditor(props: BorderEditorProps) {
    const paths = rampStepPaths("border");
    const steps = getRamp("border").steps;

    return (
        <>
            <SemanticSlotList
                group="border"
                title="Borders"
                info={BORDERS_INFO}
                renderPreview={value => (
                    <BorderLine width={typeof value === "string" ? value : ""} />
                )}
                {...props}
            />

            <Collapsible title="Border width scale" hint={`${steps.length} steps`}>
                <div className="flex flex-col divide-y divide-neutral-dimmed">
                    {paths.map((path, index) => (
                        <BorderStepRow key={path} {...props} path={path} step={steps[index]} />
                    ))}
                </div>
            </Collapsible>
        </>
    );
});
