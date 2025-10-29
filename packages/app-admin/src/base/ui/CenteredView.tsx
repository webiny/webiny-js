import React from "react";
import { makeDecoratable } from "~/index.js";

export interface CenteredViewProps {
    children: React.ReactNode;
    maxWidth?: number | string;
}

export const CenteredView = makeDecoratable(
    "CenteredView",
    ({ maxWidth, children }: CenteredViewProps) => {
        return (
            <div className={"container"} style={{ maxWidth }}>
                {children}
            </div>
        );
    }
);
