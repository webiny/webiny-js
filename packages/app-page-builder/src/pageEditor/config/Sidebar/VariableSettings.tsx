import React from "react";
import { VariableSettings as BaseVariableSettings } from "~/editor/plugins/elementSettings/variable/VariableSettings";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";
import { useBlockReference } from "~/templateEditor/config/Sidebar/useBlockReference";

export const VariableSettings = () => {
    const blockReference = useBlockReference();
    const [isTemplateMode] = useTemplateMode();

    if (isTemplateMode || blockReference) {
        return <BaseVariableSettings />;
    }

    return null;
};
