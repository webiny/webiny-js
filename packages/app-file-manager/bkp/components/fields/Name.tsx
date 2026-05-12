import React from "react";
import { Input, Label } from "@webiny/admin-ui";
import { validation } from "@webiny/validation";
import { useBind } from "@webiny/form";
import { useFile, useFileManagerApi } from "~/index.js";

export const Name = () => {
    const { file } = useFile();
    const { canEdit } = useFileManagerApi();
    const bind = useBind({
        name: "name",
        validators: [validation.create("required")]
    });

    return (
        <Input
            {...bind}
            label={
                <Label
                    text={"Name"}
                    hint={"Choose a descriptive name that's easy to remember."}
                    required
                />
            }
            disabled={!canEdit(file)}
            autoFocus
            placeholder={"Enter name"}
        />
    );
};
