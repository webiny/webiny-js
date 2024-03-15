import React, { useRef, useCallback, cloneElement } from "react";
import { createValidators } from "~/utils/createValidators";
import { BindComponent, CmsModelField } from "~/types";
import { Validator } from "@webiny/validation/types";

interface UseBindProps {
    field: CmsModelField;
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

export function useBind({ Bind, field }: UseBindProps) {
    const memoizedBindComponents = useRef<Record<string, BindComponent>>({});

    return useCallback(
        (index = -1) => {
            const { parentName } = Bind;
            // If there's a parent name assigned to the given Bind component, we need to include it in the new field "name".
            // This allows us to have nested fields (like "object" field with nested properties)
            const name = [parentName, field.fieldId, index >= 0 ? index : undefined]
                .filter(v => v !== undefined)
                .join(".");

            if (memoizedBindComponents.current[name]) {
                return memoizedBindComponents.current[name];
            }

            const validators = createValidators(field, field.validation || []);
            const listValidators = createValidators(field, field.listValidation || []);
            const defaultValue: string[] | undefined = undefined;
            const isMultipleValues = index === -1 && field.multipleValues;
            const inputValidators = isMultipleValues ? listValidators : validators;

            memoizedBindComponents.current[name] = function UseBind(params: UseBindParams) {
                const { name: childName, validators: childValidators, children } = params;

                return (
                    <Bind
                        name={childName || name}
                        validators={childValidators || inputValidators}
                        defaultValue={index === -1 ? defaultValue : null}
                    >
                        {bind => {
                            // Multiple-values functions below.
                            const props = { ...bind };
                            if (field.multipleValues && index === -1) {
                                props.appendValue = (newValue: any, index?: number) => {
                                    const currentValue = bind.value || [];
                                    const newIndex = index ?? currentValue.length;

                                    bind.onChange([
                                        ...currentValue.slice(0, newIndex),
                                        newValue,
                                        ...currentValue.slice(newIndex)
                                    ]);
                                };
                                props.prependValue = (newValue: any) => {
                                    bind.onChange([newValue, ...(bind.value || [])]);
                                };
                                props.appendValues = (newValues: any[]) => {
                                    bind.onChange([...(bind.value || []), ...newValues]);
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

                                props.moveValueUp = (index: number) => {
                                    if (index <= 0) {
                                        return;
                                    }

                                    const value = [...bind.value];
                                    value.splice(index, 1);
                                    value.splice(index - 1, 0, bind.value[index]);

                                    bind.onChange(value);
                                };

                                props.moveValueDown = (index: number) => {
                                    if (index >= bind.value.length) {
                                        return;
                                    }

                                    const value = [...bind.value];
                                    value.splice(index, 1);
                                    value.splice(index + 1, 0, bind.value[index]);

                                    bind.onChange(value);
                                };
                            }

                            const element =
                                typeof children === "function"
                                    ? children(props)
                                    : cloneElement(children, props);

                            return element;
                        }}
                    </Bind>
                );
            };

            // We need to keep track of current field name, to support nested fields.
            memoizedBindComponents.current[name].parentName = name;
            memoizedBindComponents.current[name].displayName = `Bind<${name}>`;

            return memoizedBindComponents.current[name];
        },
        [field.fieldId]
    );
}
