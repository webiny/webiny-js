import React from "react";
import { Button } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import type { AdminAssistantPendingApproval } from "@webiny/app-admin";

export interface ApprovalPlanProps {
    approvals: AdminAssistantPendingApproval[];
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}

/**
 * The arguments as the tool will receive them, as JSON. A tool that takes no arguments shows none:
 * its input arrives as `undefined` or `{}`.
 */
const toArguments = (input: unknown): string | null => {
    if (input === undefined || input === null) {
        return null;
    }
    if (typeof input === "object" && Object.keys(input).length === 0) {
        return null;
    }
    return JSON.stringify(input, null, 2);
};

/**
 * The confirm gate for a proposed change. It sits under the answer, never inside it.
 *
 * Each step shows the tool's arguments exactly as it will receive them, not a summary. A prose summary
 * would be the assistant describing its own request, and the assistant is exactly what is not yet
 * trusted here. What the user approves has to be what actually runs.
 *
 * Reject comes first and Run last, so Run is a deliberate click; Enter never approves.
 */
export const ApprovalPlan = ({ approvals, busy, onApprove, onReject }: ApprovalPlanProps) => {
    if (approvals.length === 0) {
        return null;
    }

    const destructive = approvals.some(approval => approval.destructive);
    const heading =
        approvals.length === 1 ? "Approve this change" : `Approve ${approvals.length} changes`;

    return (
        <section
            aria-label={heading}
            className={cn(
                "flex flex-col gap-sm-extra rounded-lg-plus border-sm bg-neutral-base p-md",
                destructive ? "border-destructive-default" : "border-neutral-muted"
            )}
        >
            <div className="flex items-center gap-sm">
                <span className="flex-1 text-md font-semibold text-neutral-primary">{heading}</span>
                {destructive ? (
                    <Tag variant="destructive-light" content="Cannot be undone" />
                ) : null}
            </div>

            <ol className="m-0 flex list-none flex-col gap-sm p-0">
                {approvals.map(approval => {
                    const args = toArguments(approval.input);

                    return (
                        <li key={approval.approvalId} className="flex flex-col gap-xs">
                            <code className="font-mono text-[13px] font-medium leading-5 text-neutral-primary">
                                {approval.toolName}
                            </code>
                            {args ? (
                                <pre className="m-0 whitespace-pre-wrap break-words rounded-md bg-neutral-light px-sm-extra py-sm font-mono text-sm leading-[18px] text-neutral-primary">
                                    {args}
                                </pre>
                            ) : null}
                        </li>
                    );
                })}
            </ol>

            <div className="flex justify-end gap-sm">
                <Button
                    variant="secondary"
                    size="sm"
                    text="Reject"
                    disabled={busy}
                    onClick={onReject}
                />
                <Button
                    variant="primary"
                    size="sm"
                    text="Run"
                    disabled={busy}
                    onClick={onApprove}
                />
            </div>
        </section>
    );
};
