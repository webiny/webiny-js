import React, { useMemo } from "react";
import { makeDecoratable } from "~/utils.js";
import type { CodeEditorPrimitiveProps } from "./CodeEditorPrimitive.js";
import { CodeEditorPrimitive } from "./CodeEditorPrimitive.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";

type CodeEditorProps = CodeEditorPrimitiveProps & FormComponentProps;

const DecoratableCodeEditor = ({
    label,
    description,
    note,
    hint,
    required,
    disabled,
    validation,
    ...props
}: CodeEditorProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                text={label}
                hint={hint}
                required={required}
                disabled={disabled}
                invalid={invalid}
            />
            <FormComponentDescription text={description} disabled={disabled} />
            <CodeEditorPrimitive {...props} disabled={disabled} />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={disabled}
            />
            <FormComponentNote text={note} disabled={disabled} />
        </div>
    );
};
const CodeEditor = makeDecoratable("CodeEditor", DecoratableCodeEditor);

export { CodeEditor, type CodeEditorProps };
