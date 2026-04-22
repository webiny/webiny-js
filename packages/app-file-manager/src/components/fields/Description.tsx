import React from "react";
import { Textarea, Label } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";
import { useFileOrUndefined } from "./useFileOrUndefined.js";
import { useFileManagerApi } from "~/index.js";

export const Description = () => {
    const { file } = useFileOrUndefined();
    const { canEdit } = useFileManagerApi();
    const bind = useBind({
        name: "description"
    });

    return (
        <Textarea
            {...bind}
            label={<Label text={"Description"} />}
            disabled={file ? !canEdit(file) : false}
            placeholder={"Enter description"}
        />
    );
};
