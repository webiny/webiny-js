import React, { useRef, cloneElement } from "react";
import type { Validator } from "@webiny/validation/types.js";
import { useForm } from "@webiny/form";
import { createValidators } from "~/createValidators.js";
import type { BindComponent, CmsModelField } from "~/types/index.js";
import { useModelField } from "~/ModelFieldProvider/index.js";
import { createValidationContainer } from "~/createValidationContainer.js";

interface UseBindProps {
    Bind: BindComponent;
}

interface UseBindParams {
    name?: string;
    validators?: Validator | Validator[];
    children?: any;
    defaultValue?: any;
}

const createFieldCacheKey = (field: CmsModelField) => {
    return [
        field.id,
        field.fieldId,
        JSON.stringify(field.validation),
        JSON.stringify(field.listValidation)
    ].join(";");
};

export interface GetBindCallable {
    (index?: number): BindComponent;
}

const emptyValidators: Validator[] = [];

export function useBind({ Bind }: UseBindProps) {
    const { field } = useModelField();
    const memoizedBindComponents = useRef<Record<string, BindComponent>>({});
    const cacheKey = createFieldCacheKey(field);
    const form = useForm();

    return (index = -1) => {
        const { parentName } = Bind;

        // If there's a parent name assigned to the given Bind component, we need to include it in the new field "name".
        // This allows us to have nested fields (like "object" field with nested properties)
        const name = [parentName, field.fieldId, index >= 0 ? index : undefined]
            .filter(v => v !== undefined)
            .join(".");

        const componentId = `${name};${cacheKey}`;

        if (memoizedBindComponents.current[componentId]) {
            return memoizedBindComponents.current[componentId];
        }

        const validators = createValidators(field, field.validation || emptyValidators);
        const listValidators = createValidators(field, field.listValidation || emptyValidators);
        const isMultipleValues = index === -1 && field.list;
        const inputValidators = isMultipleValues ? listValidators : validators;

        // We only use default values for single-value fields.
        const defaultValueFromSettings = !isMultipleValues ? field.settings?.defaultValue : null;

        memoizedBindComponents.current[componentId] = function UseBind(params: UseBindParams) {
            const {
                name: childName,
                validators: childValidators,
                children,
                defaultValue = defaultValueFromSettings
            } = params;

            const { field } = useModelField();

            return (
                <Bind
                    name={childName || name}
                    validators={childValidators || inputValidators}
                    defaultValue={defaultValue ?? null}
                    context={{ field }}
                >
                    {bind => {
                        // Multiple-values functions below.
                        const props = { ...bind };
                        if (field.list && index === -1) {
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

                                const value = [
                                    ...bind.value.slice(0, index),
                                    ...bind.value.slice(index + 1)
                                ];

                                bind.onChange(value.length === 0 ? null : value);

                                // To make sure the field is still valid, we must trigger validation.
                                form.validateInput(field.fieldId);
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

                        return typeof children === "function"
                            ? children(props)
                            : cloneElement(children, props);
                    }}
                </Bind>
            );
        } as BindComponent;

        // We need to keep track of current field name, to support nested fields.
        memoizedBindComponents.current[componentId].parentName = name;
        memoizedBindComponents.current[componentId].displayName = `Bind<${name}>`;
        memoizedBindComponents.current[componentId].ValidationContainer =
            createValidationContainer(name);

        return memoizedBindComponents.current[componentId];
    };
}
