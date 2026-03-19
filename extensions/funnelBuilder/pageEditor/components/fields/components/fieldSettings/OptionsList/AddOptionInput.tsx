import React from "react";
import { Input } from "webiny/admin/ui";
import { Form } from "webiny/admin/form";
import type { BindComponentRenderPropValidation } from "@webiny/form/types";
import { FieldOption } from "./types";

interface AddOptionInputProps {
    onAdd: (value: string) => void;
    options: FieldOption[];
    validation: BindComponentRenderPropValidation;
}

export const AddOptionInput = ({
    options,
    onAdd,
    validation: optionsValidation
}: AddOptionInputProps) => {
    return (
        <Form>
            {({ Bind }) => (
                <Bind
                    name={"newOption"}
                    validators={(value: string) => {
                        if (!Array.isArray(options)) {
                            return true;
                        }

                        if (options.find(item => item.value === value)) {
                            throw new Error(`Option with value "${value}" already exists.`);
                        }
                        return true;
                    }}
                >
                    {({ value, onChange, validate, validation: inputValidation }) => {
                        const validation =
                            inputValidation && inputValidation.message
                                ? inputValidation
                                : optionsValidation;
                        return (
                            <Input
                                validation={validation}
                                value={value}
                                onChange={onChange}
                                onEnter={async () => {
                                    if (value) {
                                        const result = await validate();
                                        if (result !== false) {
                                            onChange("");
                                            onAdd(value.trim());
                                        }
                                    }
                                }}
                                placeholder={"Enter an option and press enter"}
                            />
                        );
                    }}
                </Bind>
            )}
        </Form>
    );
};
