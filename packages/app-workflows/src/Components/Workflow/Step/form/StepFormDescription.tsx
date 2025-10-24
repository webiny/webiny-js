import React from "react";
import { Bind } from "@webiny/form";
import { Input } from "@webiny/admin-ui";

export const StepFormDescription = () => {
    return (
        <Bind name={"description"}>
            <Input label={"Give your workflow a description (Optional)"} size={"lg"} />
        </Bind>
    );
};
