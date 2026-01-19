import React from "react";

export const markdownComponents = {
    pre: ({ children }: { children: React.ReactNode }) => {
        return <pre className={"p-md bg-neutral-dimmed rounded mt-2"}>{children}</pre>;
    }
};
