import React, { useMemo } from "react";
import { makeDecoratable } from "~/utils.js";
import type { SegmentedControlPrimitiveProps } from "./primitives/index.js";
import { SegmentedControlPrimitive } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";

type SegmentedControlProps = SegmentedControlPrimitiveProps & FormComponentProps;

const DecoratableSegmentedControl = ({
    label,
    description,
    note,
    hint,
    required,
    disabled,
    validation,
    ...props
}: SegmentedControlProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);

    return (
        <div className="w-full">
            <FormComponentLabel
                text={label}
                hint={hint}
                required={required}
                disabled={disabled}
                invalid={invalid}
            />
            <FormComponentDescription
                text={description}
                disabled={disabled}
                className="mb-xs-plus"
            />
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={disabled}
                className="mt-none mb-xs-plus"
            />
            <SegmentedControlPrimitive {...props} disabled={disabled} />
            <FormComponentNote text={note} disabled={disabled} />
        </div>
    );
};

const SegmentedControl = makeDecoratable("SegmentedControl", DecoratableSegmentedControl);

export { SegmentedControl, type SegmentedControlProps };
