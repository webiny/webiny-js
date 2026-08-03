import React from "react";
import { ColorPickerPrimitive } from "./primitives/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import { Separator } from "~/Separator/index.js";
import { Text } from "~/Text/index.js";
import { Tooltip } from "~/Tooltip/index.js";
import { cn, makeDecoratable } from "~/utils.js";

export interface TokenSwatch {
    /** Stable identifier — a design token path, for callers that use one. */
    id: string;
    label: string;
    /** Resolved colour, used to paint the swatch. */
    value: string;
}

export interface TokenSwatchGroup {
    label: string;
    swatches: TokenSwatch[];
}

export interface TokenColorPickerProps {
    /** Swatches offered, grouped under readable headings. */
    groups: TokenSwatchGroup[];
    /**
     * When false the free colour input is hidden entirely, so only the offered swatches can be
     * chosen. This is the constrained mode a theme's policy can impose.
     */
    allowFreeValue?: boolean;
    /** The current literal value, shown in the trigger and in the free input. */
    value?: string;
    /** Set when the current value came from a swatch rather than being typed. */
    selectedId?: string | null;
    onSelectSwatch: (swatch: TokenSwatch) => void;
    onSelectValue: (value: string) => void;
    disabled?: boolean;
    /** Shown under the swatches when the free input is hidden, to explain why. */
    constrainedNote?: string;
}

const Swatch = ({
    swatch,
    selected,
    onSelect
}: {
    swatch: TokenSwatch;
    selected: boolean;
    onSelect: () => void;
}) => (
    <Tooltip
        content={`${swatch.label} · ${swatch.value}`}
        rawTrigger={true}
        trigger={
            <button
                type="button"
                onClick={onSelect}
                aria-label={swatch.label}
                aria-pressed={selected}
                className={cn(
                    "size-6 rounded-sm border border-neutral-dimmed-darker",
                    // A selected swatch gets a ring, not just a border: the swatch itself is a
                    // colour the theme chose, so it cannot be relied on to carry selection state.
                    selected && "ring-2 ring-accent-default ring-offset-1"
                )}
                style={{ background: swatch.value }}
            />
        }
    />
);

/**
 * A colour picker that offers a theme's palette.
 *
 * Deliberately presentational: it knows nothing about themes, tokens or policy. The caller supplies
 * grouped swatches and decides whether a free value is allowed, which keeps the design system free
 * of a dependency on the Theme app.
 *
 * Requirements it implements, from the Theme design brief section 7.2: swatches grouped under
 * readable headings; a swatch selection visually distinct from a literal; the selected swatch still
 * marked when reopened; and two modes — constrained (swatches only) and open (free input alongside).
 */
const DecoratableTokenColorPicker = ({
    groups,
    allowFreeValue = true,
    value,
    selectedId,
    onSelectSwatch,
    onSelectValue,
    disabled,
    constrainedNote
}: TokenColorPickerProps) => {
    const hasSwatches = groups.some(group => group.swatches.length > 0);

    // With no swatches to offer there is nothing for this picker to add, so it degrades to the
    // plain colour input rather than showing an empty popover.
    if (!hasSwatches) {
        return (
            <ColorPickerPrimitive
                value={value}
                disabled={disabled}
                size="md"
                onChangeComplete={onSelectValue}
            />
        );
    }

    return (
        <PopoverPrimitive>
            <PopoverPrimitive.Trigger asChild={true}>
                <button
                    type="button"
                    disabled={disabled}
                    aria-label="Choose a colour"
                    className={cn(
                        "size-8 rounded-sm border border-neutral-dimmed-darker",
                        selectedId && "ring-2 ring-accent-default ring-offset-1",
                        disabled && "pointer-events-none opacity-50"
                    )}
                    style={{ background: value ?? "transparent" }}
                />
            </PopoverPrimitive.Trigger>

            <PopoverPrimitive.Content align="start" className="w-[264px] p-sm">
                <div className="flex flex-col gap-sm">
                    {groups
                        .filter(group => group.swatches.length > 0)
                        .map(group => (
                            <div key={group.label} className="flex flex-col gap-xs">
                                <Text
                                    size="sm"
                                    className="block uppercase tracking-wide font-semibold text-neutral-strong"
                                >
                                    {group.label}
                                </Text>
                                <div className="flex flex-wrap gap-xs">
                                    {group.swatches.map(swatch => (
                                        <Swatch
                                            key={swatch.id}
                                            swatch={swatch}
                                            selected={swatch.id === selectedId}
                                            onSelect={() => onSelectSwatch(swatch)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                    <Separator />

                    {allowFreeValue ? (
                        <div className="flex items-center gap-sm">
                            <ColorPickerPrimitive
                                value={value}
                                size="md"
                                onChangeComplete={onSelectValue}
                            />
                            <Text size="sm" className="text-neutral-strong">
                                Any colour
                            </Text>
                        </div>
                    ) : (
                        <Text size="sm" className="block text-neutral-strong">
                            {constrainedNote ?? "Colours are set by the active theme."}
                        </Text>
                    )}
                </div>
            </PopoverPrimitive.Content>
        </PopoverPrimitive>
    );
};

export const TokenColorPicker = makeDecoratable("TokenColorPicker", DecoratableTokenColorPicker);
