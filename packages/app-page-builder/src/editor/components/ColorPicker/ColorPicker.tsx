import React, { useState, useCallback } from "react";
import classnames from "classnames";
import styled from "@emotion/styled";
import { css } from "emotion";
import classNames from "classnames";
import isEqual from "lodash/isEqual";
import { ChromePicker, ColorResult, RGBColor } from "react-color";
import { Menu } from "@webiny/ui/Menu";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";

// Icons
import { ReactComponent as IconPalette } from "../../assets/icons/round-color_lens-24px.svg";
import { ReactComponent as ColorizeIcon } from "./colorize.svg";
import { ReactComponent as NoColorSelectedIcon } from "./unselected.svg";
import { COLORS } from "../../plugins/elementSettings/components/StyledComponents";

const ColorPickerStyle = styled("div")({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between"
});

const CompactColorPicker = styled("div")({
    display: "flex",
    justifyContent: "flex-end",
    "& .mdc-menu-surface--anchor": {
        /**
         * This menu is being treated differently because its parent "Accordion" has property "overflow: hidden",
         * which makes it impossible to show the complete content of absolute positioned element using z-index.
         * To overcome this issue, we're using a trick known as "Popping Out of Hidden Overflow"
         * https://css-tricks.com/popping-hidden-overflow/
         */
        position: "static",
        "& .mdc-menu-surface": {
            transition: "transform 0.12s cubic-bezier(0, 0, 0.2, 1)"
        },
        /**
         * Adjusting Menu position due to the fact it's positioned relative to "Accordion" and not to its direct parent.
         */
        "& .mdc-menu-surface--open": {
            transform: "translate(-42px, 64px)"
        }
    },
    "& .mdc-menu-surface": {
        overflow: "visible"
    }
});

const ColorList = styled("div")({
    display: "flex"
});

const ColorPreview = styled("div")({
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    border: `1px solid ${COLORS.gray}`,
    backgroundColor: COLORS.lightGray,

    ".color": {
        width: 20,
        height: 20,
        cursor: "pointer"
    },

    "& .not-selected": {
        width: 20,
        height: 20
    }
});

const ColorBox = styled("div")({
    cursor: "pointer",
    width: 50,
    height: 40,
    margin: 10,
    padding: 5,
    borderRadius: 2,
    boxSizing: "border-box",
    transition: "transform 0.2s",
    color: "var(--mdc-theme-text-secondary-on-background)"
});

const Color = styled("div")({
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

const chromePickerStyles = css({
    width: "100%",
    ".chrome-picker": {
        boxShadow: "none !important",
        width: "100% !important"
    }
});

const iconPaletteStyle = css({
    height: 20,
    width: "100%",
    marginTop: 1,
    color: "var(--mdc-theme-secondary)"
});

const styles = {
    selectedColor: css({
        boxShadow: "0px 0px 0px 2px var(--mdc-theme-secondary)"
    }),
    button: css({
        backgroundColor: COLORS.lightGray,
        borderRadius: 1,
        border: `1px solid ${COLORS.gray}`,
        cursor: "pointer",
        height: 30,
        boxSizing: "border-box",
        "&:hover:not(:disabled)": { borderColor: COLORS.darkGray, backgroundColor: COLORS.gray },
        "&:focus:not(:disabled)": {
            borderColor: COLORS.darkGray,
            outline: "none",
            backgroundColor: COLORS.gray
        },
        "&:disabled": {
            opacity: 0.5,
            cursor: "not-allowed",
            borderColor: COLORS.lightGray
        },
        "& svg": {
            width: 16,
            height: 16
        }
    }),
    color: css({
        width: "40px",
        height: "100%",
        borderRadius: "2px"
    })
};

interface ColorPickerProps {
    value: string;
    onChange: (value: string) => void;
    onChangeComplete: (value: string) => void;
    compact?: boolean;
    handlerClassName?: string;
}

const ColorPicker = ({ value, onChange, onChangeComplete, compact = false }: ColorPickerProps) => {
    const [showPicker, setShowPicker] = useState(false);

    const getColorValue = useCallback((rgb: RGBColor) => {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`;
    }, []);

    const onColorChange = useCallback(
        (color: ColorResult) => {
            onChange(getColorValue(color.rgb));
        },
        [onChange]
    );

    const onColorChangeComplete = useCallback(
        ({ rgb }: ColorResult) => {
            onChangeComplete(getColorValue(rgb));
        },
        [onChangeComplete]
    );

    const hidePicker = useCallback(() => {
        setShowPicker(false);
    }, [setShowPicker]);

    const togglePicker = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            setShowPicker(!showPicker);
        },
        [showPicker, setShowPicker]
    );

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

    // Either a custom color or a color coming from the theme object.
    const actualSelectedColor = themeColors[value] || value || "#fff";

    let themeColor = false;
    const colorPicker = (
        <ColorPickerStyle onClick={hidePicker}>
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
                                hidePicker();

                                // With page elements implementation, we want to store the color key and
                                // then the actual color will be retrieved from the theme object.
                                onChangeComplete(key);
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
                        hidePicker();
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
                <span onClick={e => e.stopPropagation()} className={chromePickerStyles}>
                    <ChromePicker
                        color={actualSelectedColor}
                        onChange={onColorChange}
                        onChangeComplete={onColorChangeComplete}
                    />
                </span>
            )}
        </ColorPickerStyle>
    );

    if (compact) {
        return (
            <CompactColorPicker>
                <Menu
                    anchor={"bottomLeft"}
                    handle={
                        <button className={styles.button}>
                            <ColorizeIcon />
                        </button>
                    }
                >
                    <ColorList>
                        {React.cloneElement(colorPicker, { style: { width: 240 } })}
                    </ColorList>
                </Menu>
                <ColorPreview>
                    {value ? (
                        <button
                            className={classNames(styles.button, "color")}
                            style={{ backgroundColor: actualSelectedColor }}
                            onClick={() => onChange("")}
                        />
                    ) : (
                        <NoColorSelectedIcon className={"not-selected"} />
                    )}
                </ColorPreview>
            </CompactColorPicker>
        );
    }

    return colorPicker;
};

export default React.memo(ColorPicker, isEqual);
