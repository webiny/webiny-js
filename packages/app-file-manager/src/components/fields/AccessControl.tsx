import React from "react";
import { validation } from "@webiny/validation";
import { Select } from "@webiny/ui/Select";
import { useBind } from "@webiny/form";
import { useFileManagerApi } from "~/index";
import { useAccessControlField } from "./useAccessControlField";
import { useFileOrUndefined } from "~/components/fields/useFileOrUndefined";

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
            label={"Access Control"}
            options={options || []}
            disabled={file ? !canEdit(file) : false}
            placeholder={placeholder}
            description={"Control who can access this file."}
        />
    );
};
