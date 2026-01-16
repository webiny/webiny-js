import React from "react";
import styled from "@emotion/styled";
import { cn } from "@webiny/admin-ui";

const Wrapper = styled.div`
    #headerToolbarGrid {
        margin: 0;
        padding: 0;
        border: 0;
    }

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

/**
 * FORM
 */
export const Content = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={cn("overflow-y-auto h-main-content", className)} {...props}>
            {children}
        </div>
    );
};

export const ContentFormWrapper = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={cn("flex justify-center pt-xl", className)} {...props}>
            {children}
        </div>
    );
};

type ContentFormInnerProps = { width: string };

export const ContentFormInner = styled.div<ContentFormInnerProps>`
    width: ${props => props.width};
`;
