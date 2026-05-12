import React from "react";
import { validation } from "@webiny/validation";
import { useBind } from "@webiny/form";
import { useFileManagerApi } from "~/index.js";
import { useAccessControlField } from "./useAccessControlField.js";
import { useFileOrUndefined } from "~/presentation/config/fields/useFileOrUndefined.js";
import { Label, Select } from "@webiny/admin-ui";

interface AccessControlProps {
    defaultValue?: string;
    placeholder?: string;
}

export const AccessControl = ({ defaultValue, placeholder }: AccessControlProps) => {
    const { file } = useFileOrUndefined();
    const { canEdit } = useFileManagerApi();
    const accessControlField = useAccessControlField();

    /**
     * In reality, this condition will never happen, so we don't need to worry about hooks used further below.
     */
    if (!accessControlField) {
        return null;
    }

    const { options } = accessControlField;

    const bind = useBind({
        name: "accessControl.type",
        validators: [validation.create("required")],
        defaultValue,
        beforeChange(value, cb) {
            cb(value === "" ? undefined : value);
        }
    });

    return (
        <Select
            {...bind}
            value={bind.value || defaultValue}
            label={<Label text={"Access Control"} hint={"Control who can access this file."} />}
            options={options || []}
            disabled={file ? !canEdit(file) : false}
            placeholder={placeholder}
        />
    );
};
