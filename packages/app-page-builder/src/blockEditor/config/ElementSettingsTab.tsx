import React from "react";
import { plugins } from "@webiny/plugins";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { ElementNotLinked } from "~/blockEditor/components/elementSettingsTab/ElementNotLinked";
import VariableSettings from "~/blockEditor/components/elementSettingsTab/VariableSettings";
import VariablesList from "~/blockEditor/components/elementSettingsTab/VariablesList";
import { PbBlockEditorCreateVariablePlugin } from "~/types";
import { EditorConfig } from "~/editor/config";

export const ElementSettingsDecorator = EditorConfig.Ui.Sidebar.Elements.createDecorator(
    Original => {
        const variablePlugins = plugins.byType<PbBlockEditorCreateVariablePlugin>(
            "pb-block-editor-create-variable"
        );

        return function ElementGroup(props) {
            const [element] = useActiveElement();

            if (props.group !== "element") {
                return <Original {...props} />;
            }

            const canHaveVariable =
                element && variablePlugins.some(vp => vp.elementType === element.type);
            const hasVariable = element && element.data?.variableId;
            const isBlock = element && element.type === "block";

            return (
                <>
                    {isBlock ? <VariablesList block={element} /> : <Original {...props} />}
                    {canHaveVariable && !hasVariable && <ElementNotLinked />}
                    {canHaveVariable && hasVariable && <VariableSettings element={element} />}
                </>
            );
        };
    }
);
