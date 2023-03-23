import React from "react";
import { Input } from "@webiny/ui/Input";
import { trim } from "lodash";
import { BindComponentRenderPropValidation, Form } from "@webiny/form";
/**
 * Package react-hotkeys does not have types.
 */
// @ts-ignore
import { Hotkeys } from "react-hotkeyz";
import { FieldOption } from "~/admin/plugins/editor/formFields/components/types";

interface AddOptionInputProps {
    onAdd: (value: string) => void;
    options: FieldOption[];
    validation: BindComponentRenderPropValidation;
}
const AddOptionInput: React.VFC<AddOptionInputProps> = ({
    options,
    onAdd,
    validation: optionsValidation
}) => {
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
                            <Hotkeys
                                zIndex={110}
                                keys={{
                                    async enter() {
                                        if (value) {
                                            const result = await validate();
                                            if (result !== false) {
                                                onChange("");
                                                onAdd(trim(value));
                                            }
                                        }
                                    }
                                }}
                            >
                                <Input
                                    validation={validation}
                                    value={value}
                                    onChange={onChange}
                                    placeholder={"Enter an option and press enter"}
                                />
                            </Hotkeys>
                        );
                    }}
                </Bind>
            )}
        </Form>
    );
};

export default AddOptionInput;
