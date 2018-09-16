// @flow
import * as React from "react";
import type { FormComponentProps } from "./../types";
import { css } from "emotion";

import AceEditor from "react-ace";
import "brace/theme/github";
import "brace/theme/twilight";
import {FormElementMessage} from "webiny-ui/FormElementMessage";

/**
 * Controls the helper text below the checkbox.
 * @type {string}
 */
const webinyCheckboxHelperText = css(
    {},
    {
        "&.mdc-text-field-helper-text": {
            paddingTop: 5
        }
    }
);

type Props = FormComponentProps & {
    theme: string,

    // Description beneath the input.
    description?: React.Node
};

/**
 * CodeEditor component can be used to store simple boolean values.
 */
class CodeEditor extends React.Component<Props> {
    onChange = (value: string) => {
        this.props.onChange && this.props.onChange(value);
    };

    render() {
        const {
            value,
            description,
            validation = { isValid: null },
            theme = "github",
            ...rest
        } = this.props;

        return (
            <React.Fragment>
                <AceEditor
                    value={value ? String(value) : ""}
                    theme={theme}
                    onChange={this.onChange}
                    {...rest}
                    width="100%"
                    className={"mdc-text-field"}
                />

                {validation.isValid === false && (
                    <FormElementMessage error className={webinyCheckboxHelperText}>
                        {validation.message}
                    </FormElementMessage>
                )}

                {validation.isValid !== false && description && (
                    <FormElementMessage className={webinyCheckboxHelperText}>
                        {description}
                    </FormElementMessage>
                )}
            </React.Fragment>
        );
    }
}

export { CodeEditor };
