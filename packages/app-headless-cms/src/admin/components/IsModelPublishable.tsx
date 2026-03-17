import React from "react";
import { useIsModelPublishable } from "~/admin/hooks/useIsModelPublishable.js";

export interface IsPublishableProps {
    children: React.ReactNode;
}

export const IsModelPublishable = (props: IsPublishableProps) => {
    const isPublishable = useIsModelPublishable();

    return isPublishable ? <>{props.children}</> : null;
};
