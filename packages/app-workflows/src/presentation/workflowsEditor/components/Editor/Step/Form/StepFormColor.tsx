import React from "react";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ColorPicker } from "@webiny/admin-ui";

export const StepFormColor = () => {
    return (
        <Bind name={"color"} validators={validation.create("required")}>
            {({ onChange, value }) => {
                return (
                    <ColorPicker
                        label="Color"
                        required={true}
                        value={value}
                        onChangeComplete={onChange}
                    />
                );
            }}
        </Bind>
    );
};
