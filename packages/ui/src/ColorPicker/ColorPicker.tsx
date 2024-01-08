import React from "react";
import { SketchPicker, ColorResult } from "react-color";
import { css } from "emotion";
import { FormComponentProps } from "~/types";
import { FormElementMessage } from "~/FormElementMessage";
import classNames from "classnames";

const classes = {
    label: css({
        marginBottom: "10px !important"
    }),
    color: css({
        width: "36px",
        height: "14px",
        borderRadius: "2px"
    }),
    swatch: css({
        padding: "5px",
        background: "#fff",
        borderRadius: "1px",
        boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
        display: "inline-block",
        cursor: "pointer"
    }),
    // @ts-expect-error
    popover: css({
        position: "absolute",
        zIndex: "2"
    }),
    classNames: css({
        position: "fixed",
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px"
    }),
    disable: css({
        opacity: 0.7,
        pointerEvents: "none"
    })
};

interface ColorPickerState {
    showColorPicker: boolean;
}

interface ColorPickerProps extends FormComponentProps {
    // Component label.
    label?: string;

    // Is color picker disabled?
    disable?: boolean;

    // Description beneath the color picker.
    description?: string;
}

/**
 * Use ColorPicker component to display a list of choices, once the handler is triggered.
 */
class ColorPicker extends React.Component<ColorPickerProps, ColorPickerState> {
    colorPickerRef = React.createRef<HTMLDivElement>();

    public override state = {
        showColorPicker: false
    };

    public override componentDidMount() {
        document.addEventListener("click", this.handleClickOutside);
    }

    public override componentWillUnmount() {
        document.removeEventListener("click", this.handleClickOutside);
    }

    handleClickOutside = (event: MouseEvent) => {
        if (
            this.colorPickerRef.current &&
            !this.colorPickerRef.current.contains(event.target as Node)
        ) {
            this.setState({ showColorPicker: false });
        }
    };

    handleClick = () => {
        this.setState({ showColorPicker: !this.state.showColorPicker });
    };

    handleClose = () => {
        this.setState({ showColorPicker: false });
    };

    handleChange = (color: ColorResult) => {
        const { onChange } = this.props;
        onChange && onChange(color.hex);
    };

    public override render() {
        const { value, label, disable, description, validation } = this.props;

        let backgroundColorStyle = {};
        if (value) {
            backgroundColorStyle = {
                background: `${value}`
            };
        }

        const { isValid: validationIsValid, message: validationMessage } = validation || {};

        return (
            <div ref={this.colorPickerRef} className={classNames({ [classes.disable]: disable })}>
                {label && (
                    <div
                        className={classNames(
                            "mdc-text-field-helper-text mdc-text-field-helper-text--persistent",
                            classes.label
                        )}
                    >
                        {label}
                    </div>
                )}

                <div>
                    <div className={classes.swatch} onClick={this.handleClick}>
                        <div className={classes.color} style={backgroundColorStyle} />
                    </div>
                    {this.state.showColorPicker ? (
                        <div className={classes.popover}>
                            <div className={classes.classNames} onClick={this.handleClose} />
                            <SketchPicker color={value || ""} onChange={this.handleChange} />
                        </div>
                    ) : null}
                </div>

                {validationIsValid === false && (
                    <FormElementMessage error>{validationMessage}</FormElementMessage>
                )}

                {validationIsValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}
            </div>
        );
    }
}

export { ColorPicker };
