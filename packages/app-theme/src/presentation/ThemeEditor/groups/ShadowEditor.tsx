import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, ColorPickerPrimitive, Text } from "@webiny/admin-ui";
import {
    formatShadow,
    getRamp,
    getTokenAtPath,
    isShadowValue,
    rampStepPaths,
    type ShadowLayerValue,
    type ThemeMode
} from "@webiny/theme-common";
import { useThemes } from "~/presentation/useThemes.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";
import { Collapsible, EditableLength, Field, MutedNote, Toggle } from "./_shared.js";
import { SemanticSlotList } from "./SemanticSlotList.js";

const P = ({ children }: { children: React.ReactNode }) => (
    <Text size="md" as="div" className="block text-neutral-primary leading-snug">
        {children}
    </Text>
);

/** Explains elevation shadows — on the "Shadows" box. */
const SHADOW_INFO = (
    <>
        <P>
            Shadows convey elevation — how far a surface floats above the page. The named steps run
            from flat to highest, and components pick a step by role: a subtle step for cards, a
            stronger one for menus and popovers, the highest for modals.
        </P>
        <P>
            Expand a step to edit its layer — the offset (how far the shadow is cast, usually down),
            blur (how soft it is), spread (how much it grows) and color. Larger offset and blur read
            as higher elevation; a low-opacity color keeps a shadow believable.
        </P>
        <P>
            The set of steps is fixed, so a token like shadow.md means the same elevation
            everywhere.
        </P>
    </>
);

interface ShadowEditorProps {
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

/** One editable shadow step, expandable to its layer fields. */
const ShadowStep = observer(function ShadowStep({
    theme,
    path,
    step,
    mode,
    readOnly
}: {
    theme: ThemeDto;
    path: string;
    step: string;
    mode: ThemeMode;
    readOnly: boolean;
}) {
    const themes = useThemes();
    const token = getTokenAtPath(theme.tokens, path);
    const raw = token?.$value;
    const preview = isShadowValue(raw) ? formatShadow(raw) : undefined;
    // Multi-layer shadows are an edge case; the field editor handles the common single layer.
    const layer = isShadowValue(raw) && !Array.isArray(raw) ? raw : undefined;

    const setField = (patch: Partial<ShadowLayerValue>) => {
        if (!layer) {
            return;
        }
        themes.setTokenValue(path, mode, { ...layer, ...patch });
    };

    const title = (
        <div className="flex items-center gap-sm">
            <Text size="sm" className="w-10 flex-none font-mono text-neutral-strong">
                {step}
            </Text>
            <div
                className="size-8 flex-none rounded-sm bg-neutral-base"
                style={{ boxShadow: preview }}
            />
        </div>
    );

    return (
        <Accordion.Item title={title}>
            {layer ? (
                <div className="flex flex-col gap-md py-sm">
                    <Field label="Color">
                        <div className="flex items-center gap-sm">
                            <ColorPickerPrimitive
                                value={typeof layer.color === "string" ? layer.color : "#000000"}
                                size="md"
                                disabled={readOnly}
                                onChangeComplete={next => setField({ color: next })}
                            />
                            <Text size="sm" className="truncate font-mono text-neutral-dimmed">
                                {typeof layer.color === "string" ? layer.color : "—"}
                            </Text>
                        </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-sm">
                        <Field label="Offset X">
                            <EditableLength
                                value={String(layer.offsetX)}
                                disabled={readOnly}
                                onChange={value => setField({ offsetX: value })}
                            />
                        </Field>
                        <Field label="Offset Y">
                            <EditableLength
                                value={String(layer.offsetY)}
                                disabled={readOnly}
                                onChange={value => setField({ offsetY: value })}
                            />
                        </Field>
                        <Field label="Blur">
                            <EditableLength
                                value={String(layer.blur)}
                                disabled={readOnly}
                                onChange={value => setField({ blur: value })}
                            />
                        </Field>
                        <Field label="Spread">
                            <EditableLength
                                value={String(layer.spread)}
                                disabled={readOnly}
                                onChange={value => setField({ spread: value })}
                            />
                        </Field>
                    </div>

                    <div className="flex items-center justify-between gap-sm">
                        <div className="flex flex-col">
                            <Text size="sm" className="block font-medium text-neutral-strong">
                                Inset
                            </Text>
                            <Text size="sm" className="block text-neutral-dimmed leading-snug">
                                Cast the shadow inside the element.
                            </Text>
                        </div>
                        <Toggle
                            checked={layer.inset ?? false}
                            disabled={readOnly}
                            label="Inset shadow"
                            onChange={checked => setField({ inset: checked })}
                        />
                    </div>
                </div>
            ) : (
                <MutedNote>
                    This shadow has multiple layers, which are edited through the token document
                    rather than here.
                </MutedNote>
            )}
        </Accordion.Item>
    );
});

/**
 * Shadows — a fixed set of named elevation steps. Each row previews the cast shadow and expands to
 * edit its single layer (offset, blur, spread, color). Multi-layer shadows fall back to a note.
 */
export const ShadowEditor = observer(function ShadowEditor(props: ShadowEditorProps) {
    const { theme, mode, readOnly } = props;
    const paths = rampStepPaths("shadow");
    const steps = getRamp("shadow").steps;

    return (
        <>
            {/* Semantic elevation roles first — what components bind to; the raw steps sit below. */}
            <SemanticSlotList
                group="shadow"
                title="Shadows"
                renderPreview={value => (
                    <div
                        className="size-8 rounded-sm bg-neutral-base"
                        style={{
                            boxShadow: isShadowValue(value) ? formatShadow(value) : undefined
                        }}
                    />
                )}
                {...props}
            />

            <Collapsible title="Shadow scale" hint={`${steps.length} steps`} info={SHADOW_INFO}>
                {/* The underline variant border-b's every item; drop the last one so it doesn't double
                    up with the section's own bottom border. */}
                <div className="[&_.group-item:last-child]:border-b-0">
                    <Accordion variant="underline">
                        {paths.map((path, index) => (
                            <ShadowStep
                                key={path}
                                theme={theme}
                                path={path}
                                step={steps[index]}
                                mode={mode}
                                readOnly={readOnly}
                            />
                        ))}
                    </Accordion>
                </div>
            </Collapsible>
        </>
    );
});
