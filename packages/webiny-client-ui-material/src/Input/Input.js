// @flow
import * as React from "react";
import { TextField, TextFieldHelperText } from "rmwc/TextField";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

type Props = {
    /* Floating label .*/
    label?: string,
    /* Is input disabled? */
    disabled?: boolean,
    /* Description beneath the input. */
    description?: string,
    /* Placeholder is used with `fullWidth` prop instead of a `label`. `label` and `placeholder` are always mutually exclusive. */
    placeholder?: string,
    /* Converts input into a textarea with given number of rows. */
    rows?: number,
    /* Creates an outline around input. Ignored if `fullWidth` is true. */
    outlined?: boolean,
    /* Stretches the input to fit available width. */
    fullWidth?: boolean,
    /* A ref for the native input. */
    inputRef?: React.Ref<any>,
    /* Provided by <Form> component. */
    validation?: {
        /* Is input value valid? */
        isValid: null | boolean,
        /* Error message if input is not valid. */
        message: null | string,
        /* Any validation result returned by the validator. */
        results: mixed
    },
    /* A leading icon. Use `<Input.Icon/>` component. */
    leadingIcon?: React.Node,
    /* A trailing icon. Use `<Input.Icon/>` component. */
    trailingIcon?: React.Node,
    /* Provided by <Form> component to perform validation when value has changed. */
    validate?: () => Promise<mixed>,
    /* Input value. */
    value?: string,
    /* A callback that is executed each time a value is changed. */
    onChange?: (value: mixed) => any,
    /* A callback that is executed when input focus is lost. */
    onBlur?: (value: mixed) => any
};

export default class Input extends React.Component<Props> {
    static Icon = (props: Object) => <FontAwesomeIcon style={{ fontSize: 22 }} {...props} />;

    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        this.props.onChange && this.props.onChange(e.target.value);
    };

    onBlur = () => {
        const { validate, onBlur, value } = this.props;
        if (validate) {
            return validate().then(() => onBlur && onBlur(value));
        }
        return onBlur && onBlur(value);
    };

    render() {
        const {
            value,
            label,
            disabled,
            description,
            placeholder,
            outlined,
            rows,
            inputRef,
            fullWidth,
            validation = { isValid: null },
            leadingIcon,
            trailingIcon
        } = this.props;
        return (
            <React.Fragment>
                <TextField
                    inputRef={inputRef}
                    textarea={Boolean(rows)}
                    rows={rows}
                    box={!outlined && (Boolean(leadingIcon) || Boolean(trailingIcon))}
                    outlined={outlined}
                    fullwidth={fullWidth}
                    placeholder={placeholder}
                    disabled={disabled}
                    value={value || ""}
                    onChange={this.onChange}
                    onBlur={this.onBlur}
                    label={!placeholder && label}
                    withLeadingIcon={leadingIcon}
                    withTrailingIcon={trailingIcon}
                />
                {validation.isValid === false && (
                    <TextFieldHelperText persistent validationMsg>
                        {validation.message}
                    </TextFieldHelperText>
                )}
                {validation.isValid !== false &&
                    description && (
                        <TextFieldHelperText persistent>{description}</TextFieldHelperText>
                    )}
            </React.Fragment>
        );
    }
}
