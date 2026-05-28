import React from "react";
import { DragCursor } from "@webiny/admin-ui";
import { useComponent } from "~/BaseEditor/hooks/useComponent.js";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg.js";

interface DragCursorWrapperProps {
    componentName: string;
    isOverSlot: boolean;
}

export const DragCursorWrapper = ({ componentName, isOverSlot }: DragCursorWrapperProps) => {
    const component = useComponent(componentName);

    return (
        <DragCursor
            label={component?.label ?? componentName}
            icon={component?.image ? <InlineSvg src={component.image} /> : undefined}
            isOverSlot={isOverSlot}
        />
    );
};
