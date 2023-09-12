import React from "react";

import { Bind } from "@webiny/form";
import { Switch } from "@webiny/ui/Switch";
import { validation } from "@webiny/validation";

interface BooleanProps {
    name: string;
}

export const Boolean: React.VFC<BooleanProps> = ({ name }) => {
    return (
        <Bind name={name} validators={[validation.create("required")]}>
            <Switch label={"Selected"} />
        </Bind>
    );
};
