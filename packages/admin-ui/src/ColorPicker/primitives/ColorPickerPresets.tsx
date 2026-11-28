import React from "react";
import type { ColorPickerPresetView } from "./presenters/index.js";
import { cn } from "~/utils.js";

interface ColorPickerPresetsProps {
    presets: ColorPickerPresetView[];
    onSelect: (id: string) => void;
}

/* The picker's named colours as swatches. Renders nothing without presets. */
export const ColorPickerPresets = ({ presets, onSelect }: ColorPickerPresetsProps) => {
    if (presets.length === 0) {
        return null;
    }

    return (
        <div role={"group"} aria-label={"Preset colors"} className={"flex flex-wrap gap-xs pb-sm"}>
            {presets.map(preset => (
                <button
                    key={preset.id}
                    type={"button"}
                    title={preset.label}
                    aria-label={preset.label}
                    aria-pressed={preset.selected}
                    data-preset-id={preset.id}
                    onClick={() => onSelect(preset.id)}
                    className={cn(
                        "size-6 cursor-pointer rounded-xs border-sm border-solid border-neutral-muted",
                        preset.selected && "border-neutral-black"
                    )}
                    style={{ backgroundColor: preset.value }}
                />
            ))}
        </div>
    );
};
