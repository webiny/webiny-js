import React from "react";
import styled from "@emotion/styled";
import { cn } from "@webiny/admin-ui";

const Wrapper = styled.div`
    #cms-content-details-tabs > [role="tablist"] {
        display: none;
    }
`;

const FULL_SCREEN_CLASSES = ["bg-neutral-light", "fixed z-overlay top-0 left-0", "w-full h-screen"];

// Rendered inside the admin layout, below its header, so the navigation stays visible.
const IN_LAYOUT_CLASSES = ["bg-neutral-light", "flex flex-col", "w-full h-main-content"];

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Covers the whole admin (the regular entry editor). When false, renders inside the admin layout. */
    fullScreen?: boolean;
}

export const Container = ({ children, className, fullScreen = true, ...props }: ContainerProps) => {
    let classes = IN_LAYOUT_CLASSES;
    if (fullScreen) {
        classes = FULL_SCREEN_CLASSES;
    }

    return (
        <Wrapper>
            <div className={cn(classes, className)} {...props}>
                {children}
            </div>
        </Wrapper>
    );
};
