import React from "react";
import { FormComponentProps } from "~/types";
import { css } from "emotion";

import AceEditor from "react-ace";
// Modes
import "brace/mode/html";
import "brace/mode/json";
// Extensions
import "brace/ext/searchbox";
// Themes
import "brace/theme/github";
import "brace/theme/twilight";
import "brace/theme/chrome";
import { FormElementMessage } from "~/FormElementMessage";

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

interface Props extends FormComponentProps {
    mode: string;

    theme: string;

    readOnly?: boolean;

    // Description beneath the input.
    description?: React.ReactNode;
}

/**
 * CodeEditor component can be used to store simple boolean values.
 */
class CodeEditor extends React.Component<Props> {
    onChange = (value: string) => {
        this.props.onChange && this.props.onChange(value);
    };

    public override render() {
        const { value, description, validation, theme = "github", ...rest } = this.props;

        const { isValid: validationIsValid, message: validationMessage } = validation || {};

        return (
            <React.Fragment>
                <AceEditor
                    value={value ? String(value) : ""}
                    theme={theme}
                    onChange={this.onChange}
                    {...rest}
                    width="100%"
                    className={"mdc-text-field"}
                    editorProps={{
                        $blockScrolling: Infinity // Suppresses scrolling warning in console.
                    }}
                />

                {validationIsValid === false && (
                    <FormElementMessage error className={webinyCheckboxHelperText}>
                        {validationMessage}
                    </FormElementMessage>
                )}

                {validationIsValid !== false && description && (
                    <FormElementMessage className={webinyCheckboxHelperText}>
                        {description}
                    </FormElementMessage>
                )}
            </React.Fragment>
        );
    }
}

export { CodeEditor };
