import React, { useCallback } from "react";
import { css } from "emotion";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

const backgroundStyle = css`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    min-height: 100%;
`;

export const Background = () => {
    const [activeElement, setActiveElement] = useActiveElement();

    const deactivateElement = useCallback(() => {
        if (!activeElement) {
            return;
        }
        setActiveElement(null);
    }, [activeElement]);

    return <div className={backgroundStyle} onClick={deactivateElement} />;
};
