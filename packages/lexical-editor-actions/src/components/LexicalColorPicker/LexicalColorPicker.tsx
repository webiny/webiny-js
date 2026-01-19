import type { SyntheticEvent } from "react";
import React, { useCallback, useState, useEffect, useMemo } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import type { ColorState, RGBColor } from "react-color";
import { ChromePicker } from "react-color";
import type { OnChangeHandler } from "react-color/lib/components/common/ColorWrap.js";
import { Tooltip } from "@webiny/ui/Tooltip/index.js";

// Icons
import { ReactComponent as IconPalette } from "./round-color_lens-24px.svg";
import { useRichTextEditor } from "@webiny/lexical-editor";

const ColorPickerStyle = styled("div")({
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    width: 240,
    padding: 15,
    backgroundColor: "#fff"
});

const ColorBox = styled("div")({
    cursor: "pointer",
    width: 40,
    height: 40,
    borderRadius: "50%",
    margin: 5,
    border: "1px solid var(--mdc-theme-on-background)",
    padding: 3,
    boxSizing: "content-box"
});

const Color = styled("button")({
    cursor: "pointer",
    width: 40,
    height: 40,
    transition: "transform 0.1s, border 0.2s",
    borderColor: "transparent",
    display: "flex",
    alignItems: "center",
    borderRadius: "50%",
    "&::after": {
        transition: "opacity 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)",
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        opacity: 0
    },
    "&:hover": {
        transform: "scale(1.1)",
        boxShadow: "0 0.25rem 0.125rem 0 rgba(0,0,0,0.05)",
        "&::after": {
            opacity: 1
        }
    }
});

const iconPaletteStyle = css({
    height: 20,
    width: "100%",
    marginTop: 1,
    color: "var(--mdc-theme-secondary)"
});

const COLORS = {
    lightGray: "hsla(0, 0%, 97%, 1)",
    gray: "hsla(300, 2%, 92%, 1)",
    darkGray: "hsla(0, 0%, 70%, 1)",
    darkestGray: "hsla(0, 0%, 20%, 1)",
    black: "hsla(208, 100%, 5%, 1)"
};

const styles = {
    selectedColor: css({
        boxShadow: "inset 0px 0px 0px 10px var(--mdc-theme-secondary)",
        button: {
            border: "5px solid var(--mdc-theme-surface)"
        }
    }),
    button: css({
        cursor: "pointer",
        height: 30,
        boxSizing: "border-box",
        "&:hover:not(:disabled)": { backgroundColor: COLORS.gray },
        "&:focus:not(:disabled)": {
            outline: "none"
        },
        "&:disabled": {
            opacity: 0.5,
            cursor: "not-allowed"
        },
        "& svg": {
            width: 16,
            height: 16
        }
    }),
    color: css({
        width: "40px",
        height: "100%"
    })
};

const chromePickerStyle = css({
    width: "270px !important",
    margin: "15px -15px -15px -15px"
});

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
        (color: ColorState, event: React.SyntheticEvent) => {
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
        ({ rgb }: ColorState, event: React.SyntheticEvent) => {
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
        <ColorPickerStyle>
            {themeColors.map(color => {
                return (
                    <ColorBox
                        key={color.id}
                        className={color.id === value ? styles.selectedColor : ""}
                    >
                        <Tooltip content={<span>{color.label}</span>} placement="bottom">
                            <Color
                                style={{ backgroundColor: color.value }}
                                onClick={() => {
                                    onChangeComplete(color.value, color.id);
                                }}
                            />
                        </Tooltip>
                    </ColorBox>
                );
            })}

            {allowCustomColor ? (
                <ColorBox className={value && !isThemeColor ? styles.selectedColor : ""}>
                    <Tooltip content={<span>Color picker</span>} placement="bottom">
                        <Color
                            style={{ backgroundColor: isThemeColor ? "#fff" : value }}
                            onClick={togglePicker}
                        >
                            <IconPalette className={iconPaletteStyle} />
                        </Color>
                    </Tooltip>
                </ColorBox>
            ) : null}

            <div style={showPicker ? showPickerStyle : hidePickerStyle}>
                <ChromePicker
                    className={chromePickerStyle}
                    color={actualSelectedColor}
                    disableAlpha={true}
                    onChange={onColorChange as OnChangeHandler}
                    onChangeComplete={onColorChangeComplete as OnChangeHandler}
                />
            </div>
        </ColorPickerStyle>
    );
};
