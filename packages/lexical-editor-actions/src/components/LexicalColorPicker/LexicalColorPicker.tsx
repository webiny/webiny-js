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

// Color menu (Figma Webiny DS): square 16px swatches, 2px radius, 6px gap, 8px padding.
// max-w keeps ~5 swatches per row and lets it wrap for larger palettes.
const colorPickerClass = "flex flex-wrap gap-[6px] p-sm max-w-[132px] bg-neutral-base";

const swatchClass =
    "flex items-center justify-center size-4 rounded-[2px] cursor-pointer transition-transform hover:scale-110 " +
    // Subtle border so light/white swatches stay visible (Figma DS white swatch).
    "border border-neutral-dimmed-darker";

const swatchSelectedClass = "ring-2 ring-offset-1 ring-[color:var(--border-color-accent-default)]";

const iconPaletteClass = "size-4 text-neutral-strong";

// "No color" swatch: bordered square with a diagonal line, resets the font color.
const noColorSwatchClass = `${swatchClass} border border-neutral-muted bg-neutral-base relative overflow-hidden`;
const noColorLineStyle: React.CSSProperties = {
    background:
        "linear-gradient(45deg, transparent 44%, var(--border-color-neutral-strong) 44%, var(--border-color-neutral-strong) 56%, transparent 56%)"
};

const chromePickerClass = "w-[270px]! m-[15px_-15px_-15px_-15px]";

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

    const themeColors = useMemo(() => theme?.colors ?? [], []);

    useEffect(() => {
        const isThemeColor = themeColors.some(color => color.value === value);
        setIsThemeColor(isThemeColor);
    }, [themeColors, value]);

    return (
        <div className={colorPickerClass}>
            {themeColors.map(color => {
                return (
                    <Tooltip
                        key={color.id}
                        content={<span>{color.label}</span>}
                        side="bottom"
                        trigger={
                            <button
                                className={
                                    color.value === value
                                        ? `${swatchClass} ${swatchSelectedClass}`
                                        : swatchClass
                                }
                                style={{ backgroundColor: color.value }}
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
                            className={
                                value && !isThemeColor
                                    ? `${swatchClass} ${swatchSelectedClass}`
                                    : swatchClass
                            }
                            style={{ backgroundColor: isThemeColor ? "#fff" : value }}
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
                        onClick={() => onChangeComplete(RESET_COLOR)}
                    >
                        <span className={"absolute inset-0"} style={noColorLineStyle} />
                    </button>
                }
            />

            <div style={showPicker ? showPickerStyle : hidePickerStyle}>
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
