import React from "react";

import { Bind } from "@webiny/form";
import { Switch } from "@webiny/ui/Switch";
import { validation } from "@webiny/validation";

export const Boolean = () => {
    return (
        <Bind name={"value"} validators={[validation.create("required")]}>
            <Switch label={"Selected"} />
        </Bind>
    );
};
