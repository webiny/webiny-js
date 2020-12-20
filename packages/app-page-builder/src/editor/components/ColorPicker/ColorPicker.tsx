import React, { useState, useCallback } from "react";
import classnames from "classnames";
import styled from "@emotion/styled";
import { css } from "emotion";
import classNames from "classnames";
import { isEqual } from "lodash";
import { ChromePicker } from "react-color";
import { Menu } from "@webiny/ui/Menu";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
// Icons
import { ReactComponent as IconPalette } from "@webiny/app-page-builder/editor/assets/icons/round-color_lens-24px.svg";
import { ReactComponent as ColorizeIcon } from "./colorize.svg";
import { ReactComponent as NoColorSelectedIcon } from "./unselected.svg";
import { COLORS } from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";

const ColorPickerStyle = styled("div")({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between"
});

const CompactColorPicker = styled("div")({
    display: "flex",
    justifyContent: "flex-end",
    "& .mdc-menu-surface--anchor": {
        position: "static"
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

type ColorPickerProps = {
    value: string;
    onChange: Function;
    onChangeComplete: Function;
    compact?: boolean;
    handlerClassName?: string;
};

const ColorPicker = ({ value, onChange, onChangeComplete, compact = false }: ColorPickerProps) => {
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
                            style={{ backgroundColor: value }}
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
