import React from "react";
import { Input } from "@webiny/ui/Input";
import trim from "lodash/trim";
import { BindComponentRenderPropValidation, Form } from "@webiny/form";
import { FieldOption } from "~/admin/plugins/editor/formFields/components/types";

interface AddOptionInputProps {
    onAdd: (value: string) => void;
    options: FieldOption[];
    validation: BindComponentRenderPropValidation;
}

const AddOptionInput = ({ options, onAdd, validation: optionsValidation }: AddOptionInputProps) => {
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
                                            onAdd(trim(value));
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

export default AddOptionInput;
