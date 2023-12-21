import React, { useMemo } from "react";
import { validation } from "@webiny/validation";
import { Select } from "@webiny/ui/Select";
import { useFile, useFileManagerApi, useFileModel } from "~/index";
import { useBind } from "@webiny/form";

export const AccessControl = () => {
    const model = useFileModel();

    const accessControlField = useMemo(
        () => model.fields.find(field => field.fieldId === "accessControl"),
        []
    );

    if (!accessControlField || !accessControlField.settings) {
        return null;
    }

    const typeField = accessControlField.settings.fields?.find(field => field.fieldId === "type");

    if (!typeField) {
        return null;
    }

    const options = useMemo(() => {
        return typeField.predefinedValues?.values.map(pv => {
            return {
                value: pv.value,
                label: pv.label
            };
        });
    }, []);

    const defaultValue = useMemo(() => {
        const selectedOptions = typeField.predefinedValues?.values.find(v => v.selected);
        return selectedOptions ? selectedOptions.value : "public";
    }, []);

    return <AccessControlInput options={options} defaultValue={defaultValue} />;
};

interface AccessControlInputProps {
    defaultValue: string;
    options: React.ComponentProps<typeof Select>["options"];
}

const AccessControlInput = ({ options, defaultValue }: AccessControlInputProps) => {
    const { file } = useFile();
    const { canEdit } = useFileManagerApi();

    const bind = useBind({
        name: "accessControl.type",
        validators: [validation.create("required")],
        defaultValue
    });

    return (
        <Select
            {...bind}
            value={bind.value || defaultValue}
            label={"Access Control"}
            options={options || []}
            disabled={!canEdit(file)}
            description={"Control who can access this file."}
        />
    );
};
