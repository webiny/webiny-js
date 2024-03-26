import React from "react";
import { VariableSettings } from "~/editor/plugins/elementSettings/variable/VariableSettings";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";
import { PageEditorConfig } from "~/pageEditor/editorConfig/PageEditorConfig";
import { ScrollableContainer } from "~/editor/defaultConfig/Sidebar/ScrollableContainer";

export const TemplateMode = PageEditorConfig.Sidebar.Elements.createDecorator(Original => {
    return function TemplateMode(props) {
        const [isTemplateMode] = useTemplateMode();

        if (props.group === "groups" && isTemplateMode) {
            return (
                <ScrollableContainer>
                    <VariableSettings />
                </ScrollableContainer>
            );
        }

        return <Original {...props} />;
    };
});
