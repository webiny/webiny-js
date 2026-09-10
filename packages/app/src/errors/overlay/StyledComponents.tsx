import React from "react";

interface WrapperProps {
    children: React.ReactNode;
}

// z-index 105 is intentionally above Dialogs (whose highest z-index is 100).
export const OverlayWrapper = ({ children }: WrapperProps) => (
    <div className={"fixed top-0 left-0 w-screen h-screen z-[105]"}>{children}</div>
);

export const Pre = ({ children }: WrapperProps) => (
    <pre
        className={
            "relative block p-[0.5em] my-[0.5em] overflow-x-auto whitespace-pre-wrap rounded text-inherit bg-[rgba(251,245,180,0.3)] [&_code]:font-mono [&_code]:text-[0.85rem] [&_code]:leading-[1rem]"
        }
    >
        {children}
    </pre>
);
