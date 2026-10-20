import React from "react";

/** What the assistant says, on the accent tint, so it reads apart from the questions. */
export const AssistantBubble = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl bg-primary-subtle p-md text-md text-neutral-primary">{children}</div>
);
