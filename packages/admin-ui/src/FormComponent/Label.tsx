import React, { useMemo } from "react";
import { cn, makeDecoratable } from "~/utils.js";
import type { LabelProps } from "~/Label/index.js";
import { Label } from "~/Label/index.js";
import type { GenericRecord } from "@webiny/utils";

interface FormComponentLabelProps extends React.HTMLAttributes<HTMLDivElement> {
    text?: React.ReactElement<typeof Label> | React.ReactNode;
    invalid?: boolean;
    required?: boolean;
    disabled?: boolean;
    hint?: React.ReactNode;
    htmlFor?: string;
    /**
     * The `<label>`'s own id — for a control that can't be a label's `htmlFor` target
     * (a radio group, a slider thumb), which names itself with `aria-labelledby` instead.
     */
    labelId?: string;
}

const DecoratableFormComponentLabel = ({
    htmlFor,
    labelId,
    text,
    required,
    disabled,
    hint,
    invalid,
    className,
    ...props
}: FormComponentLabelProps) => {
    // UseMemo correctly to memoize the rendered label
    const renderLabel = useMemo(() => {
        if (!text) {
            return null;
        }

        if (React.isValidElement(text) && text.type === Label) {
            const textProps = text.props as GenericRecord;
            return React.cloneElement(text as React.ReactElement<LabelProps>, {
                ...textProps,
                htmlFor: textProps.htmlFor ?? htmlFor,
                id: textProps.id ?? labelId,
                required: textProps.required ?? required,
                disabled: textProps.disabled ?? disabled,
                hint: textProps.hint ?? hint,
                invalid: textProps.invalid ?? invalid
            });
        }

        return (
            <Label
                htmlFor={htmlFor}
                id={labelId}
                text={text}
                required={required}
                disabled={disabled}
                hint={hint}
                invalid={invalid}
            />
        );
    }, [text, required, disabled, hint, invalid, htmlFor, labelId]);

    if (!renderLabel) {
        return null;
    }

    return (
        <div {...props} className={cn("mb-xs", className)}>
            {renderLabel}
        </div>
    );
};

const FormComponentLabel = makeDecoratable("FormComponentLabel", DecoratableFormComponentLabel);

export { FormComponentLabel, type FormComponentLabelProps };
