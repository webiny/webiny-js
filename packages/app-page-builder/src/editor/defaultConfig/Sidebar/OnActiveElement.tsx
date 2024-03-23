import React from "react";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

interface OnActiveElementProps {
    children?: React.ReactNode;
}

export const OnActiveElement = ({ children }: OnActiveElementProps) => {
    const [element] = useActiveElement();

    if (!element) {
        return null;
    }

    return <>{children}</>;
};
