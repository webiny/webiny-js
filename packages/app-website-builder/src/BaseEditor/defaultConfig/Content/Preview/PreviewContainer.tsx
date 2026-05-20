import React from "react";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";

interface PreviewContainerProps {
    children: React.ReactNode;
}

export const PreviewContainer = ({ children }: PreviewContainerProps) => {
    const uiHeight = useSelectFromEditor(state => state.uiReservedSpace.height);

    return (
        <div
            id={"preview-container"}
            style={{ height: `calc(100vh - ${uiHeight}px)` }}
            className={"bg-neutral-subtle relative flex flex-col items-center w-full overflow-auto"}
        >
            {children}
        </div>
    );
};
