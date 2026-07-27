import type { SyntheticEvent } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColorResult, RGBColor } from "react-color";
import { ChromePicker } from "react-color";
import { Tooltip } from "@webiny/admin-ui";

// Icons
import { ReactComponent as IconPalette } from "./round-color_lens-24px.svg";
import { ReactComponent as ResetIcon } from "@webiny/icons/format_color_reset.svg";
import { useRichTextEditor } from "@webiny/lexical-editor";

// Applied to reset the font color back to the theme/inherited default.
const RESET_COLOR = "inherit";

// Popover content: design-system tokens, compact swatches, ring-based selected state.
// max-w (not fixed w) so the popover hugs its content for a few colors and wraps for many.
const colorPickerClass = "flex flex-wrap gap-sm p-sm-extra max-w-[240px] bg-neutral-base";

const swatchClass =
    "flex items-center justify-center size-6 rounded-full cursor-pointer border border-neutral-dimmed transition-transform hover:scale-110";

const swatchSelectedClass = "ring-2 ring-offset-2 ring-[color:var(--border-color-accent-default)]";

const iconPaletteClass = "size-4 text-neutral-strong";

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
                content={<span>Reset color</span>}
                side="bottom"
                trigger={
                    <button className={swatchClass} onClick={() => onChangeComplete(RESET_COLOR)}>
                        <ResetIcon className={iconPaletteClass} />
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
