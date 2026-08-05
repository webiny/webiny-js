import type { SyntheticEvent } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColorResult, RGBColor } from "react-color";
import { ChromePicker } from "react-color";
import { Tooltip } from "@webiny/admin-ui";

// Icons
import { ReactComponent as IconPalette } from "./round-color_lens-24px.svg";
import { useRichTextEditor } from "@webiny/lexical-editor";

// Applied to reset the font color back to the theme/inherited default.
const RESET_COLOR = "inherit";

// Some theme colors are bare CSS vars (e.g. `var(--wa-theme-color3)`) that may be undefined,
// which renders black. Inject a fallback so an undefined color renders as a white swatch with
// a gray border (bg falls back to white, border to gray) instead.
const BG_FALLBACK = "var(--color-neutral-base)";
const BORDER_FALLBACK = "var(--border-color-neutral-dimmed-darker)";
const withColorFallback = (color: string, fallback: string): string => {
    const trimmed = color.trim();
    return /^var\(\s*--[^,()]+\)$/.test(trimmed)
        ? trimmed.replace(/\)$/, `, ${fallback})`)
        : trimmed;
};

// Color menu (Figma Webiny DS): square 16px swatches, 2px radius, 6px gap, 8px padding.
// max-w keeps ~5 swatches per row and lets it wrap for larger palettes.
const colorPickerClass = "flex flex-wrap gap-[6px] p-sm max-w-[132px] bg-neutral-base";
// When the custom ChromePicker is open (allowCustomColors), the compact max-w would clip the
// picker (the dropdown has overflow:hidden), so widen to fit the picker's natural ~225px width.
const colorPickerExpandedClass = "flex flex-wrap gap-[6px] p-sm w-[257px] bg-neutral-base";

const swatchClass =
    "flex items-center justify-center size-4 rounded-[2px] cursor-pointer transition-transform hover:scale-110 " +
    // 2px border (Figma DS) so light/white swatches stay visible.
    "border-2 border-neutral-dimmed-darker";

const iconPaletteClass = "size-4 text-neutral-strong";

// "No color" swatch: bordered square with a diagonal line, resets the font color.
const noColorSwatchClass = `${swatchClass} bg-neutral-base relative overflow-hidden`;
// No-color border is neutral-muted (Figma), applied inline to win over swatchClass's color.
const noColorSwatchStyle: React.CSSProperties = {
    borderColor: "var(--border-color-neutral-muted)"
};
const noColorLineStyle: React.CSSProperties = {
    background:
        "linear-gradient(45deg, transparent 44%, var(--border-color-neutral-muted) 44%, var(--border-color-neutral-muted) 56%, transparent 56%)"
};

// Natural width, centered on its own full-width row below the swatches, with a top gap.
const chromePickerClass = "mx-auto mt-sm shadow-none!";

interface LexicalColorPickerProps {
    value: string;
    onChange?: (color: string) => void;
    onChangeComplete: (color: string, name?: string) => void;
    handlerClassName?: string;
    allowCustomColor?: boolean;
}

const showPickerStyle = { display: "block" };
const hidePickerStyle = { display: "none" };

export const LexicalColorPicker = ({
    value,
    onChange,
    onChangeComplete,
    allowCustomColor
}: LexicalColorPickerProps) => {
    const [showPicker, setShowPicker] = useState(false);
    // Either a custom color or a color coming from the theme object.
    const [actualSelectedColor, setActualSelectedColor] = useState(value || "#fff");
    const [isThemeColor, setIsThemeColor] = useState(false);

    useEffect(() => {
        if (value) {
            setActualSelectedColor(value);
        }
    }, [value]);

    const getColorValue = useCallback((rgb: RGBColor, alpha?: number) => {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha ?? rgb.a})`;
    }, []);

    const onColorChange = useCallback(
        (color: Pick<ColorResult, "rgb">, event: React.SyntheticEvent) => {
            event.preventDefault();
            // controls of the picker are updated as user moves the mouse
            const customColor = getColorValue(color.rgb, color.rgb.a === 0 ? 1 : color.rgb.a);
            setActualSelectedColor(customColor);
            if (typeof onChange === "function") {
                onChange(customColor);
            }
        },
        [onChange]
    );

    const onColorChangeComplete = useCallback(
        ({ rgb }: Pick<ColorResult, "rgb">, event: React.SyntheticEvent) => {
            event.preventDefault();
            const color = getColorValue(rgb, rgb.a === 0 ? 1 : rgb.a);
            setActualSelectedColor(color);
            onChangeComplete(color);
        },
        [onChangeComplete]
    );

    const togglePicker = useCallback((e: SyntheticEvent) => {
        e.stopPropagation();
        setShowPicker(state => !state);
    }, []);

    const { theme } = useRichTextEditor();

    const themeColors = useMemo(() => theme?.colors ?? [], [theme]);

    useEffect(() => {
        const isThemeColor = themeColors.some(color => color.value === value);
        setIsThemeColor(isThemeColor);
    }, [themeColors, value]);

    return (
        <div className={showPicker ? colorPickerExpandedClass : colorPickerClass}>
            {themeColors.map(color => {
                return (
                    <Tooltip
                        key={color.id}
                        content={<span>{color.label}</span>}
                        side="bottom"
                        trigger={
                            <button
                                className={swatchClass}
                                // Border matches the color so there's no gray ring on
                                // colored swatches; the gray border only shows for light/white.
                                style={{
                                    backgroundColor: withColorFallback(color.value, BG_FALLBACK),
                                    borderColor: withColorFallback(color.value, BORDER_FALLBACK)
                                }}
                                onClick={() => {
                                    onChangeComplete(color.value, color.id);
                                }}
                            />
                        }
                    />
                );
            })}

            {allowCustomColor ? (
                <Tooltip
                    content={<span>Color picker</span>}
                    side="bottom"
                    trigger={
                        <button
                            className={swatchClass}
                            style={{
                                backgroundColor: isThemeColor ? "#fff" : value,
                                borderColor: "var(--border-color-neutral-dimmed-darker)"
                            }}
                            onClick={togglePicker}
                        >
                            <IconPalette className={iconPaletteClass} />
                        </button>
                    }
                />
            ) : null}

            <Tooltip
                content={<span>No color</span>}
                side="bottom"
                trigger={
                    <button
                        className={noColorSwatchClass}
                        style={noColorSwatchStyle}
                        onClick={() => onChangeComplete(RESET_COLOR)}
                    >
                        <span className={"absolute inset-0"} style={noColorLineStyle} />
                    </button>
                }
            />

            <div className={"w-full"} style={showPicker ? showPickerStyle : hidePickerStyle}>
                <ChromePicker
                    className={chromePickerClass}
                    color={actualSelectedColor}
                    disableAlpha={true}
                    onChange={onColorChange}
                    onChangeComplete={onColorChangeComplete}
                />
            </div>
        </div>
    );
};
