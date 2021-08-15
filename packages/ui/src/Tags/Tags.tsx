import * as React from "react";
import { Input } from "../Input";
import { Chips, Chip } from "../Chips";
import { FormComponentProps } from "./../types";
import { css } from "emotion";
import keycode from "keycode";
import { ReactComponent as BaselineCloseIcon } from "./icons/baseline-close-24px.svg";
import { FormElementMessage } from "../FormElementMessage";

type Props = FormComponentProps & {
    /**
     * Component label.
     */
    label?: string;

    /**
     * Are input and chosen tags disabled?
     */
    disabled?: boolean;

    /**
     * Placeholder text for the form control. Set to a blank string to create a non-floating placeholder label.
     */
    placeholder?: string;

    /**
     * Description beneath the input.
     */
    description?: string;

    /**
     * A className for the root element.
     */
    className?: string;

    /**
     * Default structure of value, an object consisting of "id" and "name" keys. Different keys can be set using "valueProp" and "textProp" props.
     */
    value?: { id: string; name: string };

    /**
     * Callback that gets executed on change of input value.
     */
    onInput?: Function;

    /**
     * Callback that gets executed when the input is focused.
     */
    onFocus?: Function;

    /**
     * Automatically focus on the tags input.
     */
    autoFocus?: boolean;
};

type State = {
    inputValue: string;
};

const tagsStyle = css({
    position: "relative",
    ".mdc-elevation--z1": {
        position: "absolute",
        width: "calc(100% - 2px)",
        left: 1,
        top: 56,
        zIndex: 10,
        maxHeight: 200,
        overflowY: "scroll",
        backgroundColor: "var(--mdc-theme-surface)"
    },
    ul: {
        listStyle: "none",
        width: "100%",
        padding: 0,
        li: {
            padding: 10
        }
    }
});

export class Tags extends React.Component<Props, State> {
    state = {
        inputValue: ""
    };

    static defaultProps = {
        validation: { isValid: null }
    };

    render() {
        const { validation, value, disabled, onChange, description, ...otherInputProps } =
            this.props;

        const inputProps = {
            ...otherInputProps,
            value: this.state.inputValue,
            onChange: inputValue => {
                this.setState({ inputValue });
            },
            onKeyDown: e => {
                if (!onChange) {
                    return;
                }

                const newValue = Array.isArray(value) ? [...value] : [];
                const inputValue = this.state.inputValue || "";

                switch (keycode(e)) {
                    case "enter":
                        if (inputValue) {
                            newValue.push(inputValue);
                            onChange(newValue);
                            this.setState({ inputValue: "" });
                        }
                        break;
                    case "backspace":
                        if (newValue.length && !inputValue) {
                            newValue.splice(-1, 1);
                            onChange(newValue);
                            break;
                        }
                }
            }
        };

        return (
            <div className={tagsStyle}>
                <div>
                    <Input {...inputProps} />

                    {validation.isValid === false && (
                        <FormElementMessage error>{validation.message}</FormElementMessage>
                    )}
                    {validation.isValid !== false && description && (
                        <FormElementMessage>{description}</FormElementMessage>
                    )}

                    {Array.isArray(value) && value.length ? (
                        <Chips disabled={disabled}>
                            {value.map((item, index) => (
                                <Chip
                                    label={item}
                                    trailingIcon={<BaselineCloseIcon />}
                                    key={`${item}-${index}`}
                                    onRemove={() => {
                                        // On removal, let's update the value and call "onChange" callback.
                                        if (onChange) {
                                            const newValue = [...value];
                                            newValue.splice(index, 1);
                                            onChange(newValue);
                                        }
                                    }}
                                />
                            ))}
                        </Chips>
                    ) : null}
                </div>
            </div>
        );
    }
}

export default Tags;
