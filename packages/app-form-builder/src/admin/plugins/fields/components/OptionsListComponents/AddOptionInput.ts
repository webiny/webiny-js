// @flow
// $FlowFixMe
import React from "react";
import { Input } from "@webiny/ui/Input";
import { trim } from "lodash";
import { Form } from "@webiny/form";
import { Hotkeys } from "react-hotkeyz";

export default function AddOptionInput({ options, onAdd, validation: optionsValidation }: *) {
    return (
        <Form>
            {({ Bind }) => (
                <Bind
                    name={"newOption"}
                    validators={value => {
                        if (!Array.isArray(options)) {
                            return true;
                        }

                        if (options.find(item => item.value === value)) {
                            throw new Error(`Option with value "${value}" already exists.`);
                        }
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
}
