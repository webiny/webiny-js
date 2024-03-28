import React, { useCallback, useState, SyntheticEvent } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import classnames from "classnames";
import { ChromePicker, ColorState, RGBColor } from "react-color";
import { OnChangeHandler } from "react-color/lib/components/common/ColorWrap";

// Icons
import { ReactComponent as IconPalette } from "./round-color_lens-24px.svg";

const ColorPickerStyle = styled("div")({
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: 225,
    padding: 0,
    backgroundColor: "#fff"
});

const ColorBox = styled("div")({
    cursor: "pointer",
    width: 50,
    height: 40,
    margin: 10,
    borderRadius: 2
});

const Color = styled("button")({
    cursor: "pointer",
    width: 40,
    height: 30,
    border: "1px solid var(--mdc-theme-on-background)",
    transition: "transform 0.2s, scale 0.2s",
    display: "flex",
    alignItems: "center",
    "&::after": {
        boxShadow: "0 0.25rem 0.125rem 0 rgba(0,0,0,0.05)",
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
        transform: "scale(1.25)",
        "&::after": {
            opacity: 1
        }
    }
});

const transparent = css({
    backgroundSize: "10px 10px",
    backgroundImage:
        "linear-gradient( 45deg, #555 25%, transparent 25%, transparent)," +
        "linear-gradient(-45deg, #555 25%, transparent 25%, transparent)," +
        "linear-gradient( 45deg, transparent 75%, #555 75%)," +
        "linear-gradient(-45deg, transparent 75%, #555 75%)"
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
        boxShadow: "0px 0px 0px 2px var(--mdc-theme-secondary)"
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

interface LexicalColorPickerProps {
    value: string;
    onChange?: (color: string) => void;
    onChangeComplete: (color: string, name?: string) => void;
    handlerClassName?: string;
}

export const LexicalColorPicker = ({
    value,
    onChange,
    onChangeComplete
}: LexicalColorPickerProps) => {
    const [showPicker, setShowPicker] = useState(false);
    // Either a custom color or a color coming from the theme object.
    const [actualSelectedColor, setActualSelectedColor] = useState(value || "#fff");
    let themeColor = false;

    const getColorValue = useCallback((rgb: RGBColor) => {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`;
    }, []);

    const onColorChange = useCallback(
        (color: ColorState, event: React.SyntheticEvent) => {
            event.preventDefault();
            // controls of the picker are updated as user moves the mouse
            const customColor = getColorValue(color.rgb);
            setActualSelectedColor(customColor);
            if (typeof onChange === "function") {
                onChange(customColor);
            }
        },
        [onChange]
    );

    const onColorChangeComplete = useCallback(
        ({ rgb }: ColorState, event: React.SyntheticEvent) => {
            setActualSelectedColor(value);
            onChangeComplete(getColorValue(rgb));
            event.preventDefault();
        },
        [onChangeComplete]
    );

    const togglePicker = useCallback((e: SyntheticEvent) => {
        e.stopPropagation();
        setShowPicker(!showPicker);
    }, []);

    const pageElements = usePageElements();

    const themeColors: Record<string, any> = {};
    const colors = pageElements.theme?.styles?.colors;
    if (colors) {
        for (const key in colors) {
            if (colors[key]) {
                themeColors[key] = colors[key];
            }
        }
    }

    return (
        <ColorPickerStyle>
            {Object.keys(themeColors).map((key, index) => {
                const color = themeColors[key];

                if (color === value || value === "transparent") {
                    themeColor = true;
                }
                return (
                    <ColorBox key={index}>
                        <Color
                            className={key === value ? styles.selectedColor : ""}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                                // With page elements implementation, we want to store the color key and
                                // then the actual color will be retrieved from the theme object.
                                const colors = pageElements.theme?.styles?.colors;
                                onChangeComplete(colors[key], key);
                            }}
                        />
                    </ColorBox>
                );
            })}

            <ColorBox>
                <Color
                    className={classnames(transparent, {
                        [styles.selectedColor]: value === "transparent"
                    })}
                    onClick={() => {
                        onChangeComplete("transparent");
                    }}
                />
            </ColorBox>

            <ColorBox>
                <Color
                    className={value && !themeColor ? styles.selectedColor : ""}
                    style={{ backgroundColor: themeColor ? "#fff" : value }}
                    onClick={togglePicker}
                >
                    <IconPalette className={iconPaletteStyle} />
                </Color>
            </ColorBox>

            {showPicker && (
                <ChromePicker
                    color={actualSelectedColor}
                    // TODO figure out types for the props
                    onChange={onColorChange as OnChangeHandler}
                    onChangeComplete={onColorChangeComplete as OnChangeHandler}
                />
            )}
        </ColorPickerStyle>
    );
};
