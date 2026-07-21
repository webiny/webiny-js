import type { SyntheticEvent } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColorResult, RGBColor } from "react-color";
import { ChromePicker } from "react-color";
import { Tooltip } from "@webiny/admin-ui";

// Icons
import { ReactComponent as IconPalette } from "./round-color_lens-24px.svg";
import { useRichTextEditor } from "@webiny/lexical-editor";

const colorPickerClass = "relative flex flex-wrap justify-start w-[240px] p-[15px] bg-white";

const colorBoxClass =
    "cursor-pointer w-10 h-10 rounded-full m-[5px] border border-solid border-[color:var(--mdc-theme-on-background)] p-[3px] box-content";

const selectedColorClass =
    "shadow-[inset_0px_0px_0px_10px_var(--mdc-theme-secondary)] [&_button]:border-[5px] [&_button]:border-solid [&_button]:border-[color:var(--mdc-theme-surface)]";

const colorButtonClass =
    "cursor-pointer w-10 h-10 flex items-center rounded-full border-transparent [transition:transform_0.1s,_border_0.2s] " +
    "after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:-z-10 after:opacity-0 after:[transition:opacity_0.5s_cubic-bezier(0.165,0.84,0.44,1)] " +
    "hover:scale-110 hover:shadow-[0_0.25rem_0.125rem_0_rgba(0,0,0,0.05)] hover:after:opacity-100";

const iconPaletteClass = "h-5 w-full mt-px text-[color:var(--mdc-theme-secondary)]";

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
        const isThemeColor = themeColors.some(color => color.id === value);
        setIsThemeColor(isThemeColor);
    }, [themeColors, value]);

    return (
        <div className={colorPickerClass}>
            {themeColors.map(color => {
                return (
                    <div
                        key={color.id}
                        className={
                            color.id === value
                                ? `${colorBoxClass} ${selectedColorClass}`
                                : colorBoxClass
                        }
                    >
                        <Tooltip
                            content={<span>{color.label}</span>}
                            side="bottom"
                            trigger={
                                <button
                                    className={colorButtonClass}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => {
                                        onChangeComplete(color.value, color.id);
                                    }}
                                />
                            }
                        />
                    </div>
                );
            })}

            {allowCustomColor ? (
                <div
                    className={
                        value && !isThemeColor
                            ? `${colorBoxClass} ${selectedColorClass}`
                            : colorBoxClass
                    }
                >
                    <Tooltip
                        content={<span>Color picker</span>}
                        side="bottom"
                        trigger={
                            <button
                                className={colorButtonClass}
                                style={{ backgroundColor: isThemeColor ? "#fff" : value }}
                                onClick={togglePicker}
                            >
                                <IconPalette className={iconPaletteClass} />
                            </button>
                        }
                    />
                </div>
            ) : null}

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
