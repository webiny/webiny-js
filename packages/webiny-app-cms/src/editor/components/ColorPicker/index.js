//@flow
import React from "react";
import classnames from "classnames";
import styled from "react-emotion";
import { css } from "emotion";
import { ChromePicker } from "react-color";
import { Menu } from "webiny-ui/Menu";
import { withTheme } from "webiny-app-cms/theme";
import { ReactComponent as IconPalette } from "webiny-app-cms/editor/assets/icons/round-color_lens-24px.svg";
import { Tooltip } from "webiny-ui/Tooltip";

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

const Color = styled("div")({
    cursor: "pointer",
    borderRadius: "50%",
    width: 32,
    height: 32,
    margin: 10,
    padding: 5,
    boxShadow: "inset 0px 0px 0px 3px var(--mdc-theme-on-background)",
    boxSizing: "border-box",
    transition: "transform 0.2s, box-shadow 0.2s",
    "&:hover": {
        transform: "scale(1.25)"
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
        boxShadow: "inset 0px 0px 0px 5px var(--mdc-theme-secondary)"
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

type Props = {
    theme: Object,
    onChange: Function,
    onChangeComplete: Function,
    value: string,
    compact?: boolean
};

type State = {
    showPicker: boolean
};

class ColorPicker extends React.Component<Props, State> {
    state = {
        showPicker: false
    };

    getColorValue = rgb => {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`;
    };

    onChange = color => {
        this.props.onChange(this.getColorValue(color.rgb));
    };

    onChangeComplete = ({ rgb }) => {
        this.props.onChangeComplete(this.getColorValue(rgb));
    };

    hidePicker = () => {
        this.setState({ showPicker: false });
    };

    togglePicker = e => {
        e.stopPropagation();
        this.setState(state => ({ showPicker: !state.showPicker }));
    };

    render() {
        const { theme, value, compact = false } = this.props;

        let themeColor = false;

        const colorPicker = (
            <ColorPickerStyle onClick={this.hidePicker}>
                {Object.values(theme.colors).map((color, index) => {
                    if (color === value || value === "transparent") {
                        themeColor = true;
                    }

                    return (
                        <Tooltip
                            key={index}
                            content={<span>{typeof color === "string" && color.toString()}</span>}
                            placement={"bottom"}
                        >
                            <Color
                                className={color === value ? styles.selectedColor : null}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                    this.hidePicker();
                                    this.props.onChange(color);
                                }}
                            />
                        </Tooltip>
                    );
                })}

                <Tooltip content={<span>{"Transparent"}</span>} placement={"bottom"}>
                    <Color
                        className={classnames(transparent, {
                            [styles.selectedColor]: value === "transparent"
                        })}
                        onClick={() => {
                            this.hidePicker();
                            this.props.onChange("transparent");
                        }}
                    />
                </Tooltip>

                <Tooltip content={<span>{"Choose custom color"}</span>} placement={"bottom"}>
                    <Color
                        className={value && !themeColor ? styles.selectedColor : null}
                        style={{ backgroundColor: themeColor ? "#fff" : value }}
                        onClick={this.togglePicker}
                    >
                        <IconPalette className={iconPaletteStyle} />
                    </Color>
                </Tooltip>
                {this.state.showPicker && (
                    <span onClick={e => e.stopPropagation()} className={chromePickerStyles}>
                        <ChromePicker
                            color={value || "#fff"}
                            onChange={this.onChange}
                            onChangeComplete={this.onChangeComplete}
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
                        {React.cloneElement(colorPicker, { style: { width: 240 } })}
                    </Menu>
                </CompactColorPicker>
            );
        }

        return colorPicker;
    }
}

export default withTheme()(ColorPicker);
