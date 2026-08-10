import React, { useState } from "react";
import { Button, Dialog, Select, Text, Textarea } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import {
    CANONICAL_SEMANTIC_SLOTS,
    getRamp,
    getTokenAtPath,
    parseAlias,
    splitPath,
    type CanonicalSemanticSlot,
    type RampId,
    type ThemeMode,
    type TokenValue
} from "@webiny/theme-common";
import { useThemes } from "~/presentation/useThemes.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";
import { Field, InfoCard } from "./_shared.js";

/**
 * The semantic layer for a non-colour scale — see the change brief, C2/C3.
 *
 * Radius, shadow, spacing and border width each gain a fixed set of intent-named slots that point at a
 * ramp step, the same way colour slots point at brand primitives. Components bind here, never to a raw
 * step, so "which radius should a button have" has an answer.
 *
 * The list is a compact, scannable table — name, description and a real-size preview — and a row opens
 * a dialog to change its step and edit its description, matching the Typography roles screen. Keeping
 * the controls out of the list is what makes four of these screens read cleanly rather than as a wall
 * of inputs.
 */

interface SemanticSlotListProps {
    /** Which scale: `radius`, `shadow`, `space` or `border`. Its slots and ramp steps come from here. */
    group: Extract<RampId, "radius" | "shadow" | "space" | "border">;
    title: string;
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
    info?: React.ReactNode;
    /** A real-size visual of the resolved value (a rounded corner, a line at a width, a shadow). */
    renderPreview?: (resolvedValue: TokenValue | undefined) => React.ReactNode;
}

/** The step a slot currently aliases (`{radius.md}` → `md`), or "" when it holds no alias. */
const currentStepOf = (theme: ThemeDto, path: string): string => {
    const target = parseAlias(getTokenAtPath(theme.tokens, path)?.$value);
    return target ? (splitPath(target).pop() ?? "") : "";
};

const storedDescriptionOf = (theme: ThemeDto, path: string): string => {
    const stored = getTokenAtPath(theme.tokens, path)?.$description;
    return typeof stored === "string" ? stored : "";
};

/** One row: the preview, the name over its description, and the step it resolves to. */
const SemanticSlotRow = observer(function SemanticSlotRow({
    slot,
    theme,
    resolved,
    mode,
    renderPreview,
    onEdit
}: {
    slot: CanonicalSemanticSlot;
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    renderPreview?: (resolvedValue: TokenValue | undefined) => React.ReactNode;
    onEdit: (() => void) | null;
}) {
    const resolvedValue = resolved.value(slot.path, mode);
    const description = storedDescriptionOf(theme, slot.path) || slot.description;
    const step = currentStepOf(theme, slot.path);

    const cells = (
        <>
            {renderPreview ? <div className="flex-none">{renderPreview(resolvedValue)}</div> : null}
            <div className="flex-1 min-w-0">
                <Text size="md" as="div" className="truncate font-medium">
                    {slot.label}
                </Text>
                <Text size="sm" as="div" className="truncate text-neutral-strong">
                    {description}
                </Text>
            </div>
            <Text size="sm" className="flex-none font-mono text-neutral-dimmed">
                {step}
            </Text>
        </>
    );

    if (!onEdit) {
        return <div className="flex items-center gap-sm px-sm py-sm">{cells}</div>;
    }

    return (
        <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-sm rounded-sm px-sm py-sm text-left transition-colors cursor-pointer hover:bg-neutral-light"
        >
            {cells}
        </button>
    );
});

/** The editor for one slot: which step it points at, and the guidance the generation model reads. */
const SemanticSlotDialog = observer(function SemanticSlotDialog({
    slot,
    group,
    theme,
    resolved,
    mode,
    readOnly,
    renderPreview,
    onClose
}: SemanticSlotListProps & { slot: CanonicalSemanticSlot; onClose: () => void }) {
    const themes = useThemes();
    const steps = getRamp(group).steps;

    const step = currentStepOf(theme, slot.path);
    const storedDescription = storedDescriptionOf(theme, slot.path);
    const resolvedValue = resolved.value(slot.path, mode);

    return (
        <Dialog
            open={true}
            onOpenChange={next => (next ? undefined : onClose())}
            title={slot.label}
            description="Pick which step of the scale this role uses, and describe when to reach for it."
            actions={<Button variant="primary" text="Done" onClick={onClose} />}
        >
            <div className="flex flex-col gap-md">
                {renderPreview ? (
                    <div className="flex items-center justify-center rounded-sm bg-neutral-light px-sm py-lg">
                        {renderPreview(resolvedValue)}
                    </div>
                ) : null}

                <Field label="Scale step">
                    {/* The alias is mode-invariant — the step it targets carries any dark value — so it
                        is always written on the light value. */}
                    <Select
                        value={step}
                        disabled={readOnly}
                        placeholder="Step"
                        options={steps.map(candidate => ({ label: candidate, value: candidate }))}
                        onChange={(next: string) =>
                            themes.setTokenReference(slot.path, "light", `${group}.${next}`)
                        }
                    />
                </Field>

                <Field label="Description">
                    <Textarea
                        value={storedDescription}
                        disabled={readOnly}
                        rows={2}
                        placeholder={slot.description}
                        onChange={(next: string) => themes.setTokenDescription(slot.path, next)}
                    />
                </Field>
            </div>
        </Dialog>
    );
});

export const SemanticSlotList = observer(function SemanticSlotList(props: SemanticSlotListProps) {
    const { group, title, theme, resolved, mode, readOnly, info, renderPreview } = props;
    const [editing, setEditing] = useState<CanonicalSemanticSlot | null>(null);

    const slots = CANONICAL_SEMANTIC_SLOTS.filter(slot => slot.group === group);

    return (
        <InfoCard title={title} hint={`${slots.length} roles`} info={info}>
            <div className="flex flex-col divide-y divide-neutral-dimmed">
                {slots.map(slot => (
                    <SemanticSlotRow
                        key={slot.path}
                        slot={slot}
                        theme={theme}
                        resolved={resolved}
                        mode={mode}
                        renderPreview={renderPreview}
                        onEdit={readOnly ? null : () => setEditing(slot)}
                    />
                ))}
            </div>

            {editing ? (
                <SemanticSlotDialog {...props} slot={editing} onClose={() => setEditing(null)} />
            ) : null}
        </InfoCard>
    );
});
