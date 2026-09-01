import React from "react";
import styled from "@emotion/styled";
import { cn } from "@webiny/admin-ui";

const Wrapper = styled.div`
    #cms-content-details-tabs > [role="tablist"] {
        display: none;
    }
`;

export const Container = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <Wrapper>
            <div
                className={cn(
                    ["bg-neutral-light", "fixed z-overlay top-0 left-0", "w-full h-screen"],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </Wrapper>
    );
};
