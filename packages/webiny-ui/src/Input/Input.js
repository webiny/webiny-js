// @flow
import * as React from "react";
import { TextField } from "@rmwc/textfield";
import { FormElementMessage } from "webiny-ui/FormElementMessage";
import pick from "lodash/pick";
import type { FormComponentProps } from "./../types";

type Props = FormComponentProps & {
    // Auto-focus input
    autoFocus?: boolean,

    // Component label.
    label?: string,

    // Is input disabled?
    disabled?: boolean,

    // Description beneath the input.
    description?: string,

    // Placeholder is used with `fullwidth` prop instead of a `label`. `label` and `placeholder` are always mutually exclusive.
    placeholder?: string,

    // Type of input ()
    type?: string,

    // Converts input into a text area with given number of rows.
    rows?: number,

    // Creates an outline around input. Ignored if `fullwidth` is true.
    outlined?: boolean,

    // Creates a box around the input.
    box?: boolean,

    // Stretches the input to fit available width.
    fullwidth?: boolean,

    // A ref for the native input.
    inputRef?: React.Ref<any>,

    // A leading icon. Use `<InputIcon/>` component.
    leadingIcon?: React.Node,

    // A trailing icon. Use `<InputIcon/>` component.
    trailingIcon?: React.Node,

    // A callback that is executed when input focus is lost.
    onBlur?: (value: mixed) => any,

    // A callback that is executed when key is pressed / held.
    onKeyDown?: (value: mixed) => any,

    // A callback that is executed when key is pressed / held.
    onKeyPress?: (value: mixed) => any,

    // A callback that is executed when key is released.
    onKeyUp?: (value: mixed) => any,

    // CSS class name that will be added to the component.
    className?: string,

    // Function that will be called on the event, triggered while typing in the input.
    onChangeValue: ?(e: SyntheticInputEvent<HTMLInputElement> | string) => mixed,

    // Function that will be called on the event, triggered when blurring.
    onBlurValue: ?(e: SyntheticInputEvent<HTMLInputElement> | string) => mixed
};

/**
 * Use Input component to store short string values, like first name, last name, e-mail etc.
 * Additionally, with rows prop, it can also be turned into a text area, to store longer strings.
 */
class Input extends React.Component<Props> {
    static defaultProps = {
        // Added because eg. in Downshift component, we need pure event, not the value.
        onChangeValue: null,

        // Added because eg. in Downshift component, we need pure event, not the value.
        onBlurValue: null
    };

    // Props directly passed to RMWC
    static rmwcProps = [
        "label",
        "type",
        "disabled",
        "placeholder",
        "outlined",
        "onKeyDown",
        "onKeyPress",
        "onKeyUp",
        "rootProps",
        "fullwidth",
        "inputRef"
    ];

    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        const value = this.props.onChangeValue ? this.props.onChangeValue(e) : e.target.value;
        this.props.onChange && this.props.onChange(value);
    };

    onBlur = (e: SyntheticInputEvent<HTMLInputElement>) => {
        const { validate, onBlur } = this.props;
        if (validate) {
            // Since we are accessing event in an async operation, we need to persist it.
            // See https://reactjs.org/docs/events.html#event-pooling.
            e.persist();
            return validate().then(() => {
                if (onBlur) {
                    const value = this.props.onBlurValue
                        ? this.props.onBlurValue(e)
                        : this.props.value;
                    onBlur(value);
                }
            });
        }

        if (onBlur) {
            const value = this.props.onBlurValue ? this.props.onBlurValue(e) : this.props.value;
            return onBlur(value);
        }
    };

    render() {
        const {
            autoFocus,
            value,
            label,
            description,
            placeholder,
            outlined,
            rows,
            validation = { isValid: null },
            leadingIcon,
            trailingIcon,
            box,
            ...props
        } = this.props;

        let inputValue = value;
        if (value === null || typeof value === "undefined") {
            inputValue = "";
        }

        return (
            <React.Fragment>
                <TextField
                    {...pick(props, Input.rmwcProps)}
                    autoFocus={autoFocus}
                    textarea={Boolean(rows)}
                    box={box || (!outlined && (Boolean(leadingIcon) || Boolean(trailingIcon)))}
                    value={inputValue}
                    onChange={this.onChange}
                    onBlur={this.onBlur}
                    label={!placeholder && label}
                    withLeadingIcon={leadingIcon}
                    withTrailingIcon={trailingIcon}
                />

                {validation.isValid === false && (
                    <FormElementMessage error>{validation.message}</FormElementMessage>
                )}
                {validation.isValid !== false &&
                    description && <FormElementMessage>{description}</FormElementMessage>}
            </React.Fragment>
        );
    }
}

export { Input };
