import React, { useRef, useCallback, cloneElement } from "react";
import { createValidators } from "./functions/createValidators";
import { BindComponent, CmsEditorField } from "~/types";
import { Validator } from "@webiny/validation/types";

interface UseBindProps {
    field: CmsEditorField;
    Bind: BindComponent;
}

interface UseBindParams {
    name?: string;
    validators?: Validator | Validator[];
    children?: any;
}

export interface GetBindCallable {
    (index?: number): BindComponent;
}

export function useBind({ Bind: ParentBind, field }: UseBindProps) {
    const memoizedBindComponents = useRef<Record<string, BindComponent>>({});

    return useCallback(
        (index = -1) => {
            const { parentName } = ParentBind;
            // If there's a parent name assigned to the given Bind component, we need to include it in the new field "name".
            // This allows us to have nested fields (like "object" field with nested properties)
            const name = [parentName, field.fieldId, index >= 0 ? index : undefined]
                .filter(v => v !== undefined)
                .join(".");

            if (memoizedBindComponents.current[name]) {
                return memoizedBindComponents.current[name];
            }

            const validators = createValidators(field.validation || []);
            const listValidators = createValidators(field.listValidation || []);
            const defaultValue: string[] | undefined = field.multipleValues ? [] : undefined;
            const isMultipleValues = index === -1 && field.multipleValues;
            const inputValidators = isMultipleValues ? listValidators : validators;

            memoizedBindComponents.current[name] = function UseBind(params: UseBindParams) {
                const { name: childName, validators: childValidators, children } = params;
                return (
                    <ParentBind
                        name={childName || name}
                        validators={childValidators || inputValidators}
                        defaultValue={index === -1 ? defaultValue : null}
                    >
                        {bind => {
                            // Multiple-values functions below.
                            const props = { ...bind };
                            if (field.multipleValues && index === -1) {
                                props.appendValue = (newValue: string) => {
                                    bind.onChange([...bind.value, newValue]);
                                };
                                props.prependValue = (newValue: string) => {
                                    bind.onChange([newValue, ...bind.value]);
                                };
                                props.appendValues = (newValues: string[]) => {
                                    bind.onChange([...bind.value, ...newValues]);
                                };

                                props.removeValue = (index: number) => {
                                    if (index < 0) {
                                        return;
                                    }
                                    let value = bind.value;
                                    value = [...value.slice(0, index), ...value.slice(index + 1)];

                                    bind.onChange(value);

                                    // To make sure the field is still valid, we must trigger validation.
                                    bind.form.validateInput(field.fieldId);
                                };
                            }

                            if (typeof children === "function") {
                                return children(props);
                            }

                            return cloneElement(children, props);
                        }}
                    </ParentBind>
                );
            };

            // We need to keep track of current field name, to support nested fields.
            memoizedBindComponents.current[name].parentName = name;

            return memoizedBindComponents.current[name];
        },
        [field.fieldId]
    );
}
