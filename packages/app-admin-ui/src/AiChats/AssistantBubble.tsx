import React from "react";

/** What the assistant says, on the accent tint, so it reads apart from the questions. */
export const AssistantBubble = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-lg bg-primary-subtle px-md py-sm-plus text-md text-neutral-primary">
        {children}
    </div>
);
