import React from "react";
import { plugins } from "@webiny/plugins";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { ElementNotLinked } from "~/blockEditor/components/elementSettingsTab/ElementNotLinked";
import VariableSettings from "~/blockEditor/components/elementSettingsTab/VariableSettings";
import VariablesList from "~/blockEditor/components/elementSettingsTab/VariablesList";
import { PbBlockEditorCreateVariablePlugin } from "~/types";
import { useBlockReference } from "~/templateEditor/config/Sidebar/useBlockReference";

export const ElementSettingsGroup = () => {
    const variablePlugins = plugins.byType<PbBlockEditorCreateVariablePlugin>(
        "pb-block-editor-create-variable"
    );

    const [element] = useActiveElement();
    const blockReference = useBlockReference();

    const canHaveVariable = element && variablePlugins.some(vp => vp.elementType === element.type);
    const hasVariable = element && element.data?.variableId;
    const isBlock = element && element.type === "block";

    return (
        <>
            {isBlock && !blockReference ? <VariablesList block={element} /> : null}
            {canHaveVariable && !hasVariable && <ElementNotLinked />}
            {canHaveVariable && hasVariable && <VariableSettings element={element} />}
        </>
    );
};
