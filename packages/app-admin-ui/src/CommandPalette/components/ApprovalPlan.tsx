import React from "react";
import { Button } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import type { AdminAssistantPendingApproval } from "@webiny/app-admin";

export interface ApprovalPlanProps {
    approvals: AdminAssistantPendingApproval[];
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}

/*
 * Every argument, on one line. Nothing is dropped or shortened: the line is what the user is
 * approving, so it wraps rather than truncates.
 */
const formatInput = (input: unknown) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return JSON.stringify(input);
    }

    const entries = Object.entries(input);
    if (entries.length === 0) {
        return "no arguments";
    }

    return entries
        .map(([key, value]) => {
            const shown = typeof value === "string" ? value : JSON.stringify(value);
            return `${key}: ${shown}`;
        })
        .join(" · ");
};

/**
 * The confirm gate for a proposed change.
 *
 * Nothing here is the assistant describing its own request, because the assistant is exactly what
 * is not yet trusted. Each step's label is the tool's title, which the tool's author set in code, and
 * the line under it is the arguments the model actually supplied. What the user approves has to be
 * what actually runs.
 */
export const ApprovalPlan = ({ approvals, busy, onApprove, onReject }: ApprovalPlanProps) => {
    if (approvals.length === 0) {
        return null;
    }

    const destructive = approvals.some(approval => approval.destructive);

    // Each step already names its tool, so the header only counts them.
    let heading = `${approvals.length} proposed changes`;
    if (approvals.length === 1) {
        heading = "Proposed change";
    }

    return (
        <div
            className={cn(
                "overflow-hidden rounded-lg border",
                destructive
                    ? "border-destructive-subtle bg-destructive-subtle"
                    : "border-warning-200 bg-warning-subtle"
            )}
        >
            <div
                className={cn(
                    "flex items-center gap-sm border-b px-sm-plus py-sm-plus",
                    destructive ? "border-destructive-subtle" : "border-warning-200"
                )}
            >
                {/* `Icon` sets its own colour classes, so the tint comes from a wrapper it inherits. */}
                <span
                    className={cn(
                        "flex fill-current",
                        destructive ? "text-destructive-primary" : "text-warning-600"
                    )}
                >
                    <Icon
                        icon={destructive ? <WarningIcon /> : <BoltIcon />}
                        size="md"
                        label=""
                        color="inherit"
                    />
                </span>
                <Text size="md" className="font-semibold text-neutral-primary">
                    {heading}
                </Text>
                {destructive ? (
                    <Text size="sm" className="ml-auto text-destructive-primary">
                        Cannot be undone
                    </Text>
                ) : null}
            </div>

            <div className="bg-neutral-base px-sm-plus pb-sm-plus pt-sm">
                {approvals.map(approval => (
                    <div key={approval.approvalId} className="flex items-start gap-sm py-xs">
                        <Icon
                            icon={approval.destructive ? <DeleteIcon /> : <EditIcon />}
                            size="sm"
                            label=""
                            color="neutral-light"
                            className="mt-xxs"
                        />
                        <div className="min-w-0">
                            <Text as="div" size="md" className="text-neutral-primary">
                                {approval.title ?? approval.toolName}
                            </Text>
                            <Text
                                as="div"
                                size="sm"
                                className="break-all font-mono text-neutral-muted"
                            >
                                {formatInput(approval.input)}
                            </Text>
                        </div>
                    </div>
                ))}

                <div className="mt-sm-plus flex items-center gap-sm">
                    <Button variant="primary" text="Run ↵" disabled={busy} onClick={onApprove} />
                    <Button variant="secondary" text="Reject" disabled={busy} onClick={onReject} />
                    <Text size="sm" className="text-neutral-muted">
                        Nothing runs until you confirm.
                    </Text>
                </div>
            </div>
        </div>
    );
};
