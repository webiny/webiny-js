// @flow
import * as React from "react";
import { Select as RmwcSelect } from "@rmwc/select";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import type { FormComponentProps } from "./../types";
import { css } from "emotion";
import classNames from "classnames";

type Props = FormComponentProps & {
    // Component label.
    label?: string,

    // Is checkbox disabled?
    disabled?: boolean,

    // Description beneath the select.
    description?: string,

    // Placeholder text for the form control. Set to a blank string to create a non-floating placeholder label.
    placeholder?: string,

    // Makes the Select have a visual box.
    box?: string,

    // One or more <option> or <optgroup> elements.
    children?: React.ChildrenArray<React.Element<"option"> | React.Element<"optgroup">>,

    // Props for the root element. By default, additional props spread to the native select element.
    rootProps?: Object,

    // A className for the root element.
    className?: string
};

const noLabel = css({
    "&.mdc-select": {
        height: 35,
        ".mdc-select__native-control": {
            paddingTop: 0
        },
        "&.mdc-select--box": {
            ".mdc-select__native-control": {
                height: 35,
                paddingTop: 5
            }
        }
    }
});

/**
 * Select component lets users choose a value from given set of options.
 */
const skipProps = ["validate"];

const getRmwcProps = props => {
    const newProps = {};
    Object.keys(props)
        .filter(name => !skipProps.includes(name))
        .forEach(name => (newProps[name] = props[name]));

    return newProps;
};

export const Select = (props: Props) => {
    const { value, description, validation = { isValid: null }, ...other } = props;

    return (
        <React.Fragment>
            <RmwcSelect
                {...getRmwcProps(other)}
                value={value}
                className={classNames(props.className, { [noLabel]: !props.label })}
                onChange={e => {
                    props.onChange && props.onChange(e.target.value);
                }}
            />

            {validation.isValid === false && (
                <FormElementMessage error>{validation.message}</FormElementMessage>
            )}

            {validation.isValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </React.Fragment>
    );
};

export default Select;
