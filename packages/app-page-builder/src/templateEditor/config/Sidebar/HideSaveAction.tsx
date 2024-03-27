import React from "react";
import { TemplateEditorConfig } from "~/templateEditor/editorConfig/TemplateEditorConfig";
import { useBlockReference } from "~/templateEditor/config/Sidebar/useBlockReference";

const { ElementAction } = TemplateEditorConfig;

interface HideIfBlockReferenceProps {
    children: React.ReactNode;
}

const HideIfBlockReference = ({ children }: HideIfBlockReferenceProps) => {
    const blockReference = useBlockReference();

    if (blockReference) {
        return null;
    }

    return <>{children}</>;
};

export const HideSaveAction = ElementAction.createDecorator(Original => {
    return function SaveAction(props) {
        if (props.name !== "save") {
            return <Original {...props} />;
        }

        return (
            <Original
                {...props}
                element={<HideIfBlockReference>{props.element}</HideIfBlockReference>}
            />
        );
    };
});
