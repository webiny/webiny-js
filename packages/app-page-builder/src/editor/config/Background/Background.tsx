import React, { useCallback } from "react";
import { createComponentPlugin } from "@webiny/app-admin";
import { css } from "emotion";
import { EditorContent } from "~/editor";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

const backgroundStyle = css({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    minHeight: "100%"
});

const Background: React.FC = () => {
    const [activeElement, setActiveElement] = useActiveElement();

    const deactivateElement = useCallback(() => {
        if (!activeElement) {
            return;
        }
        setActiveElement(null);
    }, [activeElement]);

    return <div className={backgroundStyle} onClick={deactivateElement} />;
};

export const BackgroundPlugin = createComponentPlugin(EditorContent, PrevContent => {
    return function AddBackground() {
        return (
            <>
                <PrevContent />
                <Background />
            </>
        );
    };
});
