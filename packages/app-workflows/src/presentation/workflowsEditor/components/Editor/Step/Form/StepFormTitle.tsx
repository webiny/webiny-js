import React from "react";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/admin-ui";

export const StepFormTitle = () => {
    return (
        <Bind name={"title"} validators={validation.create("required")}>
            <Input label={"Title"} size={"lg"} />
        </Bind>
    );
};
