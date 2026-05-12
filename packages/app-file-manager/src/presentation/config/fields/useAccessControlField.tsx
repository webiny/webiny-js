import { useMemo } from "react";
import type { Select } from "@webiny/admin-ui";
import { useFileModel } from "~/index.js";

interface AccessControlField {
    options: React.ComponentProps<typeof Select>["options"];
}

export const useAccessControlField = (): AccessControlField | null => {
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
        return (typeField.predefinedValues?.values || []).map(pv => {
            return {
                value: pv.value,
                label: pv.label
            };
        });
    }, []);

    return { options };
};
