import React from "react";
import { Button } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { AiChatPendingApproval } from "@webiny/app-admin";

export interface ApprovalPlanProps {
    approvals: AiChatPendingApproval[];
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}

/**
 * The confirm gate for a proposed change.
 *
 * Arguments are shown as raw JSON on purpose. A prose summary would be the assistant describing its
 * own request — and the assistant is exactly what is not yet trusted here. What the user approves has
 * to be what actually runs.
 */
export const ApprovalPlan = ({ approvals, busy, onApprove, onReject }: ApprovalPlanProps) => {
    if (approvals.length === 0) {
        return null;
    }

    const destructive = approvals.some(approval => approval.destructive);

    let heading = `Approve ${approvals.length} changes`;
    if (approvals.length === 1) {
        heading = `Approve: ${approvals[0].title ?? approvals[0].toolName}`;
    }

    return (
        <div
            className={cn(
                "mt-sm overflow-hidden rounded-md border border-neutral-dimmed",
                destructive ? "bg-destructive-subtle" : "bg-warning-subtle"
            )}
        >
            <div className="flex items-center gap-sm border-b border-neutral-dimmed px-sm py-xs-plus">
                <Icon
                    icon={destructive ? <WarningIcon /> : <BoltIcon />}
                    size="sm"
                    label=""
                    color="inherit"
                    className={destructive ? "text-destructive-primary" : undefined}
                />
                <Text size="sm" className="font-semibold text-neutral-primary">
                    {heading}
                </Text>
                {destructive ? (
                    <Text size="sm" className="ml-auto text-destructive-primary">
                        Cannot be undone
                    </Text>
                ) : null}
            </div>

            <div className="bg-neutral-base px-sm py-xs-plus">
                {approvals.map(approval => (
                    <div key={approval.approvalId} className="mb-xs">
                        <Text as="div" size="sm" className="font-mono text-neutral-strong">
                            {approval.toolName}
                        </Text>
                        <pre className="mt-xxs overflow-x-auto rounded bg-neutral-subtle p-sm text-xs text-neutral-strong">
                            {JSON.stringify(approval.input, null, 2)}
                        </pre>
                    </div>
                ))}

                <div className="mt-sm flex items-center gap-sm">
                    <Button variant="primary" text="Run" disabled={busy} onClick={onApprove} />
                    <Button variant="secondary" text="Reject" disabled={busy} onClick={onReject} />
                    <Text size="sm" className="text-neutral-muted">
                        Nothing runs until you confirm.
                    </Text>
                </div>
            </div>
        </div>
    );
};
