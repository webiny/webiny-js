//@flow
import React, { useState, useCallback } from "react";
import classnames from "classnames";
import styled from "react-emotion";
import { css } from "emotion";
import { isEqual } from "lodash";
import { ChromePicker } from "react-color";
import { Menu } from "@webiny/ui/Menu";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { ReactComponent as IconPalette } from "@webiny/app-page-builder/editor/assets/icons/round-color_lens-24px.svg";

const ColorPickerStyle = styled("div")({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between"
});

const CompactColorPicker = styled("div")({
    ".mdc-menu-surface": {
        overflow: "visible"
    }
});

const ColorList = styled("div")({
    display: "flex"
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
        zIndex: "-1",
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
    swatch: css({
        padding: "5px",
        background: "#fff",
        borderRadius: "1px",
        boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
        display: "inline-block",
        cursor: "pointer",
        height: 30,
        boxSizing: "border-box"
    }),
    color: css({
        width: "40px",
        height: "100%",
        borderRadius: "2px"
    })
};

const ColorPicker = React.memo(({ value, onChange, onChangeComplete, compact }) => {
    const [showPicker, setShowPicker] = useState(false);

    const getColorValue = useCallback(rgb => {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`;
    }, []);

    const onColorChange = useCallback(
        color => {
            onChange(getColorValue(color.rgb));
        },
        [onChange]
    );

    const onColorChangeComplete = useCallback(
        ({ rgb }) => {
            onChangeComplete(getColorValue(rgb));
        },
        [onChangeComplete]
    );

    const hidePicker = useCallback(() => {
        setShowPicker(false);
    }, [setShowPicker]);

    const togglePicker = useCallback(
        e => {
            e.stopPropagation();
            setShowPicker(!showPicker);
        },
        [showPicker, setShowPicker]
    );

    const { theme } = usePageBuilder();

    let themeColor = false;

    const colorPicker = (
        <ColorPickerStyle onClick={hidePicker}>
            {Object.values(theme.colors).map((color, index) => {
                if (color === value || value === "transparent") {
                    themeColor = true;
                }

                return (
                    <ColorBox key={index}>
                        <Color
                            className={color === value ? styles.selectedColor : null}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                                hidePicker();
                                onChangeComplete(color);
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
                    className={value && !themeColor ? styles.selectedColor : null}
                    style={{ backgroundColor: themeColor ? "#fff" : value }}
                    onClick={togglePicker}
                >
                    <IconPalette className={iconPaletteStyle} />
                </Color>
            </ColorBox>
            {showPicker && (
                <span onClick={e => e.stopPropagation()} className={chromePickerStyles}>
                    <ChromePicker
                        color={value || "#fff"}
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
                    handle={
                        <div className={styles.swatch}>
                            <div className={styles.color} style={{ backgroundColor: value }} />
                        </div>
                    }
                >
                    <ColorList>
                        {React.cloneElement(colorPicker, { style: { width: 240 } })}
                    </ColorList>
                </Menu>
            </CompactColorPicker>
        );
    }

    return colorPicker;
}, isEqual);

export default ColorPicker;
