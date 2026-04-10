import React from "react";
import { Grid, Input, InputProps } from "@webiny/admin-ui";
import { UnsetOnUnmount } from "@webiny/form";
import { useBind } from "@webiny/form";
import { validation } from "@webiny/validation";

export const Path = (props?: InputProps) => {
    const pathBind = useBind({
        name: "properties.path",
        validators: [validation.create("required")]
    });

    return (
        <Grid.Column span={12}>
            <UnsetOnUnmount name={"properties.path"}>
                <Input label={"Path"} {...pathBind} {...props} />
            </UnsetOnUnmount>
        </Grid.Column>
    );
};
