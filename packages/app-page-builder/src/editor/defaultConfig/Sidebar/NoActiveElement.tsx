import React from "react";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

interface NoActiveElementProps {
    children?: React.ReactNode;
}

export const NoActiveElement = ({ children }: NoActiveElementProps) => {
    const [element] = useActiveElement();

    if (element) {
        return null;
    }

    return <>{children}</>;
};
