import React from "react";
import { VariableSettings } from "~/editor/plugins/elementSettings/variable/VariableSettings";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";
import { PageEditorConfig } from "~/pageEditor/editorConfig/PageEditorConfig";

export const TemplateMode = PageEditorConfig.Sidebar.Elements.createDecorator(Original => {
    return function TemplateMode(props) {
        const [isTemplateMode] = useTemplateMode();

        if (props.group === "groups" && isTemplateMode) {
            return <VariableSettings />;
        }

        return <Original {...props} />;
    };
});
