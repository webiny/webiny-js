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
                    [
                        "wby-bg-neutral-light",
                        "wby-fixed wby-z-15 wby-top-0 wby-left-0",
                        "wby-w-full wby-h-screen"
                    ],
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
        <div className={cn("wby-overflow-y-auto wby-h-main-content", className)} {...props}>
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
        <div className={cn("wby-flex wby-justify-center", className)} {...props}>
            {children}
        </div>
    );
};

type ContentFormInnerProps = { width: string };

export const ContentFormInner = styled.div<ContentFormInnerProps>`
    width: ${props => props.width};
`;
